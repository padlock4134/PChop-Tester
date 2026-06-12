import { useEffect, useRef } from 'react';

const FRESH_LOGIN_PARAM = 'fresh_login';
const VISIBILITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Uses Page Visibility API to detect when tab is hidden for extended period.
 * When tab becomes hidden (user switches tabs, minimizes browser, closes tab),
 * starts a 5-minute timer. If tab becomes visible again before timeout, cancels timer.
 * If timeout completes, calls close-session endpoint to invalidate server session.
 *
 * This is more reliable than unload events and doesn't trigger on reloads.
 */
export const useCloseSessionOnUnload = (enabled: boolean) => {
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const url = new URL(window.location.href);
    const isFreshLogin = url.searchParams.get(FRESH_LOGIN_PARAM) === '1';

    if (isFreshLogin) {
      url.searchParams.delete(FRESH_LOGIN_PARAM);
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }

    // Visibility API for tab close detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab became hidden - start 5-minute timer
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        visibilityTimeoutRef.current = setTimeout(async () => {
          try {
            await fetch('/.netlify/functions/auth-close-session', {
              method: 'POST',
              keepalive: true
            });
          } catch (error) {
            console.warn('Failed to close session on visibility timeout:', error);
          }
        }, VISIBILITY_TIMEOUT_MS);
      } else if (document.visibilityState === 'visible') {
        // Tab became visible again - cancel timer
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
};
