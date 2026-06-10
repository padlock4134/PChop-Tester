// netlify/functions/auth-session.js
// Session endpoint to get current user session data
const { clearCsrfCookie, isCsrfValid, setCsrfCookie } = require('./lib/csrf-utils.js');
const { clearSessionCookie, getSessionFromCookie, isSessionValid, setSessionCookie } = require('./lib/session-utils.js');
const { isActiveSessionCurrent, registerActiveSession, touchActiveSession } = require('./lib/active-session-utils.js');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils.js');

// Main handler function
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Get session from cookie
    const session = await getSessionFromCookie(event);
    const { csrfToken, tenantId, userId, supabaseToken, email, role } = session;
    
    // Validate API is protected
    if (!isSessionValid(session)) {
      return createErrorResponse(401);
    }
    if (!isCsrfValid(event, csrfToken)) {
      return createErrorResponse(403);
    }

    const activeSessionStatus = await isActiveSessionCurrent(session);
    if (activeSessionStatus === 'superseded') {
      return createErrorResponse(401, 'Session superseded by another login', null, [clearSessionCookie(), clearCsrfCookie()]);
    }
    if (activeSessionStatus === 'orphaned') {
      // No DB row exists (e.g. the tab-close beacon fired during a page reload and
      // deleted the row before this request arrived). Re-register so the reload
      // succeeds; a true close will be caught by the localStorage marker on next open.
      await registerActiveSession(session, event);
    }

    await touchActiveSession(session, event);

    // We want to "touch" the session and CSRF cookies to extend their expiration window.
    const touchedSessionCookie = await setSessionCookie(session);
    const touchedCsrfCookie = setCsrfCookie(csrfToken);

    // The initial session load must include data. All subsequent calls can avoid returning
    // data over the wire as an optimization.
    const query = event.queryStringParameters || {};
    const { omit_data: omitData } = query;
    const sessionData = omitData === 'true' ? {} : {
      // Response strucutre matters here!! Any additional fields go in "metadata".
      userId, tenantId, metadata: { supabaseToken, email, role }
    };

    return createOkResponseWithBody(JSON.stringify(sessionData), [touchedSessionCookie, touchedCsrfCookie], true);
  } catch (error) {
    console.error('Session validation error:', error);
    return createErrorResponse(401);
  }
};
