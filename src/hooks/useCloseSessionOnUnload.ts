import { useEffect } from 'react';

const CLOSE_SESSION_URL = '/.netlify/functions/auth-close-session';

/**
 * Invalidates the active server-side session record when the browser page is
 * closing. This is intentionally best-effort because browsers limit async work
 * during tab/browser shutdown.
 */
export const useCloseSessionOnUnload = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    let cleanupSent = false;

    const closeSession = () => {
      if (cleanupSent) return;
      cleanupSent = true;

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
