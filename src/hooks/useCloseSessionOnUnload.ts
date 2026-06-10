import { useEffect } from 'react';

const CLOSE_MARKER_KEY = 'porkchop-session-closed';
const TAB_SESSION_KEY = 'porkchop-tab-session-active';
const TAB_ID_KEY = 'porkchop-tab-session-id';
const ACTIVE_TABS_KEY = 'porkchop-active-tabs';
const FRESH_LOGIN_PARAM = 'fresh_login';

/**
 * Keeps post-login client bookkeeping from old browser-close experiments out of
 * the auth-critical path.
 *
 * This hook intentionally does not redirect, call logout, or mutate server-side
 * session state from unload/page lifecycle events. Browser close detection via
 * `pagehide`/heartbeats has repeatedly been able to misclassify login redirects,
 * reloads, and React remounts as a closed browser, causing instant logout after
 * sign-in. Login stability wins here.
 */
export const useCloseSessionOnUnload = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const url = new URL(window.location.href);
    const isFreshLogin = url.searchParams.get(FRESH_LOGIN_PARAM) === '1';

    localStorage.removeItem(CLOSE_MARKER_KEY);
    localStorage.removeItem(ACTIVE_TABS_KEY);
    sessionStorage.removeItem(TAB_ID_KEY);
    sessionStorage.setItem(TAB_SESSION_KEY, 'true');

    if (isFreshLogin) {
      url.searchParams.delete(FRESH_LOGIN_PARAM);
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  }, [enabled]);
};
