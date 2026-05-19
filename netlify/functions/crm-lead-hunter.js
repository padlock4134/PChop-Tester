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
      ? `Find up to ${safeCount} ${instType}s ${location} with CTE or vocational/trade programs (any of: ${ALL_DISCIPLINES.join(', ')}). Return as many as you can find, up to ${safeCount}.

For each, find the ${role} or equivalent senior vocational contact. Note which trade programs they offer.

OUTPUT MUST START WITH [ AND END WITH ]. NO OTHER TEXT. Each object:
[{"institution":"Full Institution Name","website":"https://institution.edu","contactName":"Full Name or Department Name","title":"Job Title","email":"email@institution.edu or empty string","phone":"(xxx) xxx-xxxx or empty string","city":"City","state":"ST","type":"${instType}","disciplines":"Culinary, HVAC, Welding","disciplineCount":3}]`
      : `Find up to ${safeCount} real ${role}s at ${instType}s ${location} who oversee a ${discipline} program. Return as many as you can find, up to ${safeCount}.

Search institutional websites and staff directories for real, verified contact information. Only include contacts where you can find a real name and title.

OUTPUT MUST START WITH [ AND END WITH ]. NO OTHER TEXT. Each object:
[{"institution":"Full Institution Name","website":"https://institution.edu","contactName":"Full Name or Department Name","title":"Job Title","email":"email@institution.edu or empty string","phone":"(xxx) xxx-xxxx or empty string","city":"City","state":"ST","type":"${instType}"}]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: Math.min(1500 * safeCount, 8000),
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
          system: 'You are a B2B lead data extractor. OUTPUT FORMAT: You must respond with ONLY a raw JSON array. No text before it. No text after it. No markdown fences. No explanations. JUST the [ ... ] array. If you cannot find a specific contact name, use the department name (e.g. "CTE Department"). If you cannot find an email, use an empty string. NEVER write sentences or paragraphs. Your output must start with [ and end with ].',
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic error:', response.status, errText);
      let detail = errText;
      try { detail = JSON.parse(errText)?.error?.message || errText; } catch {}
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `Anthropic ${response.status}: ${detail}` }) };
    }

    const data = await response.json();

    const contentTypes = (data.content || []).map(b => b.type);
    console.log('Claude content types:', contentTypes, 'stop:', data.stop_reason);

    const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text || '');
    let fullText = textBlocks.join('\n');

    if (!fullText) {
      fullText = JSON.stringify(data.content || []);
    }

    const leads = parseLeadsFromText(fullText).slice(0, safeCount);

    if (!leads.length) {
      const debugInfo = textBlocks.length
        ? fullText.slice(0, 1000)
        : `No text blocks. Types: [${contentTypes}]. stop: ${data.stop_reason}. Raw: ${JSON.stringify(data.content).slice(0, 500)}`;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: [], debug: debugInfo, quota: null })
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
