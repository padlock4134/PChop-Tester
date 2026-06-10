import { useEffect } from 'react';

const CLOSE_MARKER_KEY = 'porkchop-session-closed';
const TAB_SESSION_KEY = 'porkchop-tab-session-active';
const FRESH_LOGIN_PARAM = 'fresh_login';

/**
 * Keeps the client-side tab/session bookkeeping in sync after authentication.
 *
 * This intentionally does not call the server from pagehide/beforeunload. Those
 * events also fire during reloads, OAuth redirects, mobile tab suspension, and
 * other transient navigations; using them to invalidate the active server-side
 * session can delete the freshly-created login record before the app's first
 * session check completes, which looks like an immediate logout after sign-in.
 */
export const useCloseSessionOnUnload = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const url = new URL(window.location.href);
    const isFreshLogin = url.searchParams.get(FRESH_LOGIN_PARAM) === '1';

    if (isFreshLogin) {
      localStorage.removeItem(CLOSE_MARKER_KEY);
      sessionStorage.setItem(TAB_SESSION_KEY, 'true');
      url.searchParams.delete(FRESH_LOGIN_PARAM);
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
      return;
    }

    // Clear any legacy marker written by older builds that attempted to infer
    // browser-close logout from unload events. Keeping it would force a logout
    // after a perfectly valid restored session.
    localStorage.removeItem(CLOSE_MARKER_KEY);
    sessionStorage.setItem(TAB_SESSION_KEY, 'true');
  }, [enabled]);
};
