const crypto = require('crypto');
const { getSupabase } = require('./supabase-utils.js');

const ACTIVE_SESSIONS_TABLE = 'active_user_sessions';
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST116', 'PGRST205']);

function createSessionId () {
  return crypto.randomUUID();
}

function isMissingActiveSessionsTableError (error = {}) {
  const message = error.message || '';
  return MISSING_TABLE_CODES.has(error.code) || (/active_user_sessions/i.test(message) && /does not exist|not found|schema cache/i.test(message));
}

function getRequestMetadata (event = {}) {
  const headers = event.headers || {};
  const forwardedFor = headers['x-forwarded-for'] || headers['X-Forwarded-For'] || '';
  const ipAddress = forwardedFor.split(',')[0].trim() || headers['client-ip'] || headers['Client-Ip'] || null;
  const userAgent = headers['user-agent'] || headers['User-Agent'] || null;

  return { ipAddress, userAgent };
}

function shouldFailOpen (error) {
  if (isMissingActiveSessionsTableError(error)) {
    console.warn('Active session enforcement is not available because the active_user_sessions table is missing. Allowing session.');
    return true;
  }
  return false;
}

async function registerActiveSession (sessionData, event) {
  const { activeSessionId, userId, tenantId, supabaseToken } = sessionData;

  if (!activeSessionId || !userId || !tenantId || !supabaseToken) {
    throw new Error('Cannot register active session without activeSessionId, userId, tenantId, and supabaseToken.');
  }

  const { ipAddress, userAgent } = getRequestMetadata(event);
  const supabase = getSupabase(supabaseToken);
  const { error } = await supabase
    .from(ACTIVE_SESSIONS_TABLE)
    .upsert({
      user_id: userId,
      tenant_id: tenantId,
      active_session_id: activeSessionId,
      ip_address: ipAddress,
      user_agent: userAgent,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,tenant_id' });

  if (error) {
    if (shouldFailOpen(error)) {
      return false;
    }
    throw error;
  }

  return true;
}

async function isActiveSessionCurrent (sessionData) {
  const { activeSessionId, userId, tenantId, supabaseToken } = sessionData;

  if (!userId || !tenantId || !supabaseToken) {
    console.warn('Session is missing user, tenant, or Supabase token tracking data.');
    return false;
  }

  const supabase = getSupabase(supabaseToken);
  const { data, error } = await supabase
    .from(ACTIVE_SESSIONS_TABLE)
    .select('active_session_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    if (shouldFailOpen(error)) {
      return true;
    }
    throw error;
  }

  if (!activeSessionId) {
    console.warn('Session is missing active session id. Allowing only when no newer active session is registered.');
    return !data;
  }

  return data?.active_session_id === activeSessionId;
}

async function touchActiveSession (sessionData, event) {
  const { activeSessionId, userId, tenantId, supabaseToken } = sessionData;

  if (!activeSessionId || !userId || !tenantId || !supabaseToken) {
    return false;
  }

  const { ipAddress, userAgent } = getRequestMetadata(event);
  const updatePayload = {
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (ipAddress) updatePayload.ip_address = ipAddress;
  if (userAgent) updatePayload.user_agent = userAgent;

  const supabase = getSupabase(supabaseToken);
  const { error } = await supabase
    .from(ACTIVE_SESSIONS_TABLE)
    .update(updatePayload)
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('active_session_id', activeSessionId);

  if (error) {
    if (shouldFailOpen(error)) {
      return false;
    }
    throw error;
  }

  return true;
}

async function clearActiveSession (sessionData) {
  const { activeSessionId, userId, tenantId, supabaseToken } = sessionData;

  if (!activeSessionId || !userId || !tenantId || !supabaseToken) {
    return false;
  }

  const supabase = getSupabase(supabaseToken);
  const { error } = await supabase
    .from(ACTIVE_SESSIONS_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('active_session_id', activeSessionId);

  if (error) {
    if (shouldFailOpen(error)) {
      return false;
    }
    throw error;
  }

  return true;
}

module.exports = {
  clearActiveSession,
  createSessionId,
  isActiveSessionCurrent,
  registerActiveSession,
  touchActiveSession
};
