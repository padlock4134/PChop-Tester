// netlify/functions/crm-init.js
// Returns Supabase config + session JWT for the CRM static page.
// The CRM HTML calls this on load to get everything it needs.
const { getSessionFromCookie, isSessionValid } = require('./lib/session-utils.js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseUrl: process.env.VITE_SUPABASE_URL,
        supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
        supabaseToken: session.supabaseToken,
        userId: session.userId,
        userName: session.userName || 'You'
      })
    };
  } catch (error) {
    console.error('CRM init error:', error);
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not authenticated' })
    };
  }
};
