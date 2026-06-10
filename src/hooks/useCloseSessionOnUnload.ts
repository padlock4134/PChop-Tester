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
  }, [enabled]);
};
