// netlify/functions/crm-lead-hunter-import.js
// GET  → returns current daily quota for the authenticated user
// POST → imports approved leads into revenue.sales_accounts + sales_contacts
//        enforces 25 imports/day cap
const fetch = require('node-fetch');
const { getSessionFromCookie, isSessionValid } = require('./lib/session-utils.js');

const DAILY_CAP = 25;

function mapInstType(typeName) {
  const map = {
    'Community College': 'individual_college',
    'Technical College': 'individual_college',
    '4-Year University': 'whale_institute',
    'State System / District': 'state_system',
    'K-12 Secondary': 'other'
  };
  return map[typeName] || 'individual_college';
}

async function getUsageRow(supabaseUrl, anonKey, token, userId, today) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/lead_hunter_usage?user_id=eq.${encodeURIComponent(userId)}&import_date=eq.${today}`,
    {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'Accept-Profile': 'revenue'
      }
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] || null;
}

async function upsertUsage(supabaseUrl, anonKey, token, userId, today, newTotal) {
  const res = await fetch(`${supabaseUrl}/rest/v1/lead_hunter_usage`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Profile': 'revenue',
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ user_id: userId, import_date: today, leads_imported: newTotal })
  });
  return res.ok;
}

exports.handler = async (event) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  // ── GET: return current quota ──────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const session = await getSessionFromCookie(event);
      if (!isSessionValid(session)) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Not authenticated' })
        };
      }
      const today = new Date().toISOString().slice(0, 10);
      const row = await getUsageRow(supabaseUrl, anonKey, session.supabaseToken, session.userId, today);
      const used = row?.leads_imported || 0;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quota: { used, remaining: DAILY_CAP - used } })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ── POST: import approved leads ────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const session = await getSessionFromCookie(event);
    if (!isSessionValid(session)) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not authenticated' })
      };
    }

    let body;
    try { body = JSON.parse(event.body); } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { leads = [] } = body;
    if (!leads.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No leads provided' }) };
    }

    const today = new Date().toISOString().slice(0, 10);
    const { userId, supabaseToken } = session;

    // Check daily quota
    const usageRow = await getUsageRow(supabaseUrl, anonKey, supabaseToken, userId, today);
    const currentUsed = usageRow?.leads_imported || 0;
    const remaining = DAILY_CAP - currentUsed;

    if (remaining <= 0) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Daily import limit reached. Resets tomorrow at midnight UTC.',
          quota: { used: currentUsed, remaining: 0 }
        })
      };
    }

    // Cap to remaining quota
    const leadsToImport = leads.slice(0, remaining);
    const capped = leads.length > remaining;
    let imported = 0;

    for (const lead of leadsToImport) {
      try {
        // Upsert account (ignore duplicates by name)
        const acctRes = await fetch(`${supabaseUrl}/rest/v1/sales_accounts`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${supabaseToken}`,
            'Content-Profile': 'revenue',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates,return=representation'
          },
          body: JSON.stringify({
            name: lead.institution || 'Unknown Institution',
            account_type: mapInstType(lead.type),
            website: lead.website || null,
            state_region: lead.state || null,
            owner_user_id: userId,
            lead_status: 'new'
          })
        });

        let accountId = null;
        if (acctRes.ok) {
          const acctData = await acctRes.json();
          accountId = Array.isArray(acctData) ? acctData[0]?.id : acctData?.id;
        }

        // If account already existed (duplicate ignored), look it up by name
        if (!accountId && lead.institution) {
          const findRes = await fetch(
            `${supabaseUrl}/rest/v1/sales_accounts?name=eq.${encodeURIComponent(lead.institution)}&select=id`,
            {
              headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${supabaseToken}`,
                'Accept-Profile': 'revenue'
              }
            }
          );
          if (findRes.ok) {
            const found = await findRes.json();
            accountId = found?.[0]?.id || null;
          }
        }

        // Insert contact linked to account
        if (accountId && lead.contactName) {
          const nameParts = (lead.contactName || '').trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          await fetch(`${supabaseUrl}/rest/v1/sales_contacts`, {
            method: 'POST',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${supabaseToken}`,
              'Content-Profile': 'revenue',
              'Content-Type': 'application/json',
              'Prefer': 'resolution=ignore-duplicates,return=minimal'
            },
            body: JSON.stringify({
              account_id: accountId,
              first_name: firstName,
              last_name: lastName,
              title: lead.title || '',
              email: lead.email || '',
              phone: lead.phone || null,
              owner_user_id: userId,
              role_in_deal: 'champion'
            })
          });
        }

        imported++;
      } catch (err) {
        console.error('Error importing lead:', lead.institution, err.message);
      }
    }

    // Update daily usage counter
    const newTotal = currentUsed + imported;
    await upsertUsage(supabaseUrl, anonKey, supabaseToken, userId, today, newTotal);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imported,
        capped,
        quota: { used: newTotal, remaining: DAILY_CAP - newTotal }
      })
    };

  } catch (err) {
    console.error('Lead import error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
