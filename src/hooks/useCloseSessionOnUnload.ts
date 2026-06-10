import { useEffect, useRef } from 'react';

const CLOSE_MARKER_KEY = 'porkchop-session-closed';
const TAB_SESSION_KEY = 'porkchop-tab-session-active';
const TAB_ID_KEY = 'porkchop-tab-session-id';
const ACTIVE_TABS_KEY = 'porkchop-active-tabs';
const FRESH_LOGIN_PARAM = 'fresh_login';
const HEARTBEAT_INTERVAL_MS = 5_000;
const STALE_TAB_MS = 20_000;
const VISIBILITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

type ActiveTabs = Record<string, number>;

const now = () => Date.now();

const safeParseActiveTabs = (): ActiveTabs => {
  try {
    const rawTabs = localStorage.getItem(ACTIVE_TABS_KEY);
    if (!rawTabs) return {};

    const parsed = JSON.parse(rawTabs) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.entries(parsed as Record<string, unknown>).reduce<ActiveTabs>((tabs, [tabId, lastSeen]) => {
      if (typeof tabId === 'string' && typeof lastSeen === 'number') {
        tabs[tabId] = lastSeen;
      }
      return tabs;
    }, {});
  } catch (error) {
    console.warn('Failed to parse active tab registry:', error);
    return {};
  }
};

const writeActiveTabs = (tabs: ActiveTabs) => {
  localStorage.setItem(ACTIVE_TABS_KEY, JSON.stringify(tabs));
};

const pruneStaleTabs = (tabs: ActiveTabs, currentTime = now()) => {
  return Object.entries(tabs).reduce<ActiveTabs>((activeTabs, [tabId, lastSeen]) => {
    if (currentTime - lastSeen <= STALE_TAB_MS) {
      activeTabs[tabId] = lastSeen;
    }
    return activeTabs;
  }, {});
};

const getActiveTabs = () => pruneStaleTabs(safeParseActiveTabs());

const createTabId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${now()}-${Math.random().toString(36).slice(2)}`;
};

const markTabActive = (tabId: string) => {
  const tabs = getActiveTabs();
  tabs[tabId] = now();
  writeActiveTabs(tabs);
};

const removeTab = (tabId: string) => {
  const tabs = getActiveTabs();
  delete tabs[tabId];
  writeActiveTabs(tabs);
  return tabs;
};

const hasActiveTabs = (tabs = getActiveTabs()) => Object.keys(tabs).length > 0;

const getNavigationType = () => {
  const [navigationEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return navigationEntry?.type;
};

const redirectToLogout = () => {
  window.location.assign('/.netlify/functions/auth-logout');
};

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
    const existingTabId = sessionStorage.getItem(TAB_ID_KEY);
    const activeTabs = getActiveTabs();
    const isReload = getNavigationType() === 'reload';
    const hasCloseMarker = !!localStorage.getItem(CLOSE_MARKER_KEY);

    localStorage.removeItem(CLOSE_MARKER_KEY);
    localStorage.removeItem(ACTIVE_TABS_KEY);
    sessionStorage.removeItem(TAB_ID_KEY);
    sessionStorage.setItem(TAB_SESSION_KEY, 'true');

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
