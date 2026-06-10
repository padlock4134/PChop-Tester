import { useEffect } from 'react';

const CLOSE_MARKER_KEY = 'porkchop-session-closed';
const TAB_SESSION_KEY = 'porkchop-tab-session-active';
const TAB_ID_KEY = 'porkchop-tab-session-id';
const ACTIVE_TABS_KEY = 'porkchop-active-tabs';
const FRESH_LOGIN_PARAM = 'fresh_login';
const HEARTBEAT_INTERVAL_MS = 5_000;
const STALE_TAB_MS = 20_000;

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
 * Enforces browser-session logout without treating React remounts as tab closes.
 *
 * The important distinction is that React effect cleanup is not a browser/tab
 * close. The active-tab registry is only cleared from the real `pagehide` event;
 * cleanup only removes event listeners and timers. This prevents first-login
 * route changes, provider remounts, and React StrictMode remounts from deleting
 * the current tab and immediately logging the user out.
 */
export const useCloseSessionOnUnload = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const url = new URL(window.location.href);
    const isFreshLogin = url.searchParams.get(FRESH_LOGIN_PARAM) === '1';
    const existingTabId = sessionStorage.getItem(TAB_ID_KEY);
    const activeTabs = getActiveTabs();
    const isReload = getNavigationType() === 'reload';
    const hasCloseMarker = !!localStorage.getItem(CLOSE_MARKER_KEY);

    if (isFreshLogin) {
      localStorage.removeItem(CLOSE_MARKER_KEY);
      sessionStorage.setItem(TAB_SESSION_KEY, 'true');
      url.searchParams.delete(FRESH_LOGIN_PARAM);
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    } else if (!isReload && hasCloseMarker && !hasActiveTabs(activeTabs)) {
      redirectToLogout();
      return;
    } else if (!existingTabId && !hasActiveTabs(activeTabs)) {
      localStorage.setItem(CLOSE_MARKER_KEY, String(now()));
      redirectToLogout();
      return;
    } else {
      localStorage.removeItem(CLOSE_MARKER_KEY);
      sessionStorage.setItem(TAB_SESSION_KEY, 'true');
    }

    const tabId = existingTabId || createTabId();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
    markTabActive(tabId);

    const heartbeatId = window.setInterval(() => markTabActive(tabId), HEARTBEAT_INTERVAL_MS);

    const handlePageHide = () => {
      const remainingTabs = removeTab(tabId);
      if (!hasActiveTabs(remainingTabs)) {
        localStorage.setItem(CLOSE_MARKER_KEY, String(now()));
      }
    };
    const handlePageShow = () => {
      localStorage.removeItem(CLOSE_MARKER_KEY);
      markTabActive(tabId);
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.clearInterval(heartbeatId);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [enabled]);
};
