// netlify/functions/auth-close-session.js
// Best-effort endpoint used by the browser during pagehide/beforeunload to
// invalidate the current active session without changing the Wristband redirect flow.
const { getSessionFromCookie } = require('./lib/session-utils.js');
const { clearActiveSession } = require('./lib/active-session-utils.js');
const { createErrorResponse } = require('./lib/http-utils.js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    const sessionData = await getSessionFromCookie(event);
    await clearActiveSession(sessionData);

    return {
      statusCode: 204,
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      },
      body: ''
    };
  } catch (error) {
    // This endpoint runs while the page is unloading. Do not block the browser
    // or surface noisy errors; the next normal session check will still enforce
    // active-session state if this best-effort request fails.
    console.warn('Close-session cleanup failed:', error.message);
    return {
      statusCode: 204,
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      },
      body: ''
    };
  }
};
