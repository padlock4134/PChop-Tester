import { useEffect } from 'react';

const CLOSE_SESSION_URL = '/.netlify/functions/auth-close-session';
const CLOSE_MARKER_KEY = 'porkchop-session-closed';
const TAB_SESSION_KEY = 'porkchop-tab-session-active';
const FRESH_LOGIN_PARAM = 'fresh_login';

const getNavigationType = () => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return navigation?.type;
};

const forceLogout = () => {
  window.location.replace('/.netlify/functions/auth-logout');
};

/**
 * Invalidates the active server-side session record when the browser page is
 * closing. Also stores a local close marker so a restored browser session with
 * old cookies is forced through logout even if the unload network request is
 * dropped by the browser.
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
    } else if (localStorage.getItem(CLOSE_MARKER_KEY) && getNavigationType() !== 'reload') {
      forceLogout();
      return;
    } else {
      sessionStorage.setItem(TAB_SESSION_KEY, 'true');
    }

    let cleanupSent = false;

    const closeSession = () => {
      if (cleanupSent) return;
      cleanupSent = true;
      localStorage.setItem(CLOSE_MARKER_KEY, String(Date.now()));

      if (navigator.sendBeacon) {
        navigator.sendBeacon(CLOSE_SESSION_URL, new Blob([], { type: 'text/plain' }));
        return;
      }

      fetch(CLOSE_SESSION_URL, {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
        cache: 'no-store'
      }).catch(() => undefined);
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      closeSession();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', closeSession);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', closeSession);
    };
  }, [enabled]);
};
