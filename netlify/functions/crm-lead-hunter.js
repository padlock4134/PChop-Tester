// netlify/functions/crm-lead-hunter.js
// Scrapes the web for B2B leads using Claude's built-in web search tool.
const fetch = require('node-fetch');
const { getSessionFromCookie, isSessionValid } = require('./lib/session-utils.js');

const DAILY_CAP = 25;

async function getQuota(supabaseUrl, anonKey, supabaseToken, userId) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/lead_hunter_usage?user_id=eq.${userId}&import_date=eq.${today}&select=leads_imported`,
      {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${supabaseToken}`,
          'Accept-Profile': 'revenue'
        }
      }
    );
    if (!res.ok) return { used: 0, remaining: DAILY_CAP };
    const rows = await res.json();
    const used = rows?.[0]?.leads_imported || 0;
    return { used, remaining: DAILY_CAP - used };
  } catch {
    return { used: 0, remaining: DAILY_CAP };
  }
}

function parseLeadsFromText(text) {
  const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch {}
  }
  const arrayMatch = text.match(/(\[[\s\S]*\])/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[1]); } catch {}
  }
  return [];
}

exports.handler = async (event) => {
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

    const { discipline, institutionType, contactRole, geoScope, geoValue, count = 10 } = body;

    if (!discipline) {
      return { statusCode: 400, body: JSON.stringify({ error: 'discipline is required' }) };
    }

    const safeCount = Math.min(Math.max(Number(count) || 5, 1), 25);
    const location = geoScope === 'National'
      ? 'across the United States'
      : `in the ${geoValue} ${geoScope === 'State' ? 'state' : 'region'}`;

    const apiKey = process.env.ANTHROPIC_CRM_KEY || process.env.ANTHROPIC_CHEF_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Anthropic API key not configured' }) };
    }

    const instType = institutionType || 'Community College';
    const role = contactRole || 'Program Director';
    const isAll = discipline === 'All Disciplines';
    const ALL_DISCIPLINES = ['Culinary','Plumbing','Automotive','Construction','Electrical','HVAC','Manufacturing','Logistics','Welding'];

    const prompt = isAll
      ? `Search for "${role} CTE vocational trades ${instType} staff directory ${location}" to find real people with their name, title, email, and phone number who run CTE/vocational programs (${ALL_DISCIPLINES.join(', ')}) at ${instType}s.

Find up to ${safeCount} real people. For each person, note which trade programs their institution offers.

OUTPUT MUST START WITH [ AND END WITH ]. NO OTHER TEXT.
[{"institution":"Name","website":"url","contactName":"REAL PERSON NAME","title":"Their Actual Title","email":"their@email.edu","phone":"(xxx) xxx-xxxx","city":"City","state":"ST","type":"${instType}","disciplines":"Culinary, HVAC, Welding","disciplineCount":3}]`
      : `Search for "${role} ${discipline} program ${instType} staff directory ${location}" to find real people with their name, title, email, and phone number.

Find up to ${safeCount} real ${role}s at ${instType}s ${location} who run ${discipline} programs. Search staff directory pages and faculty listings on .edu sites.

OUTPUT MUST START WITH [ AND END WITH ]. NO OTHER TEXT.
[{"institution":"Name","website":"url","contactName":"REAL PERSON NAME","title":"Their Actual Title","email":"their@email.edu","phone":"(xxx) xxx-xxxx","city":"City","state":"ST","type":"${instType}"}]`;

    // ── STEP 1: Web search to find raw lead data ──────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    let searchResponse;
    try {
      searchResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
          system: 'You are a B2B lead researcher. Search institutional staff directories and faculty pages for real contact information. List every person you find with their full name, title, email, phone, institution name, city, and state. Include as much detail as possible.',
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error('Anthropic search error:', searchResponse.status, errText);
      let detail = errText;
      try { detail = JSON.parse(errText)?.error?.message || errText; } catch {}
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `Anthropic ${searchResponse.status}: ${detail}` }) };
    }

    const searchData = await searchResponse.json();
    const rawText = (searchData.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n');
    console.log('Step 1 raw text (first 300):', rawText.slice(0, 300));

    if (!rawText || rawText.length < 20) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: [], debug: 'Web search returned no usable text.', quota: null })
      };
    }

    // ── STEP 2: Format raw data into JSON (no web search, fast) ──────────────
    const jsonSchema = isAll
      ? '[{"institution":"Name","website":"url","contactName":"Person Name","title":"Title","email":"email","phone":"phone","city":"City","state":"ST","type":"' + instType + '","disciplines":"Culinary, HVAC","disciplineCount":2}]'
      : '[{"institution":"Name","website":"url","contactName":"Person Name","title":"Title","email":"email","phone":"phone","city":"City","state":"ST","type":"' + instType + '"}]';

    const formatResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: Math.min(1500 * safeCount, 8000),
        system: 'Convert the provided research data into a JSON array. Output ONLY the JSON array. No other text.',
        messages: [
          { role: 'user', content: `Convert this research into a JSON array with this schema:\n${jsonSchema}\n\nRules:\n- contactName must be a real person name (never a department)\n- Use empty string "" for any missing field\n- Include up to ${safeCount} results\n\nResearch data:\n${rawText}` },
          { role: 'assistant', content: '[' }
        ]
      })
    });

    if (!formatResponse.ok) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Format step failed' }) };
    }

    const formatData = await formatResponse.json();
    const jsonText = '[' + ((formatData.content || []).filter(b => b.type === 'text').map(b => b.text || '').join(''));
    console.log('Step 2 JSON (first 300):', jsonText.slice(0, 300));

    const leads = parseLeadsFromText(jsonText).slice(0, safeCount);

    if (!leads.length) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: [], debug: `Step1: ${rawText.slice(0, 500)}\nStep2: ${jsonText.slice(0, 500)}`, quota: null })
      };
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const quota = (supabaseUrl && anonKey)
      ? await getQuota(supabaseUrl, anonKey, session.supabaseToken, session.userId)
      : { used: 0, remaining: DAILY_CAP };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads, quota })
    };

  } catch (err) {
    if (err.name === 'AbortError') {
      return { statusCode: 504, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Search timed out. Try fewer leads or a narrower geography.' }) };
    }
    console.error('Lead hunter error:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};
