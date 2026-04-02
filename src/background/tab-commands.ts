import { getBaseUrl } from "~/src/utils/url";
import type { TabCommandMessage, TabCommandResponse } from "~/src/shared/background-messages";

type TabCommandHandler = (
  sender: chrome.runtime.MessageSender,
  message: TabCommandMessage
) => Promise<TabCommandResponse>;

type IndexedTab = chrome.tabs.Tab & {
  id: number;
  index: number;
};

const windowTabHistory = new Map<number, { activeTabId?: number; previousTabId?: number }>();

const getMessageWindowId = (
  sender: chrome.runtime.MessageSender,
  message: TabCommandMessage
): number | undefined => message.windowId ?? sender.tab?.windowId;

const getMessageTabIndex = (
  sender: chrome.runtime.MessageSender,
  message: TabCommandMessage
): number | undefined => message.tabIndex ?? sender.tab?.index;

const getMessageTabId = (
  sender: chrome.runtime.MessageSender,
  message: TabCommandMessage
): number | undefined => message.tabId ?? sender.tab?.id;

const listWindowTabs = async (windowId: number): Promise<IndexedTab[]> => {
  const tabs = await chrome.tabs.query({ windowId });

  return tabs.filter((tab): tab is IndexedTab => {
    return typeof tab.id === "number" && typeof tab.index === "number";
  });
};

const updateWindowTabHistory = (windowId: number, activeTabId: number): void => {
  const history = windowTabHistory.get(windowId);

  if (!history) {
    windowTabHistory.set(windowId, { activeTabId });
    return;
  }

  if (history.activeTabId === activeTabId) {
    return;
  }

  history.previousTabId = history.activeTabId;
  history.activeTabId = activeTabId;
};

chrome.tabs.onActivated.addListener(({ windowId, tabId }) => {
  updateWindowTabHistory(windowId, tabId);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const history = windowTabHistory.get(removeInfo.windowId);
  if (!history) {
    return;
  }

  if (history.activeTabId === tabId) {
    history.activeTabId = undefined;
  }

  if (history.previousTabId === tabId) {
    history.previousTabId = undefined;
  }

  if (!history.activeTabId && !history.previousTabId) {
    windowTabHistory.delete(removeInfo.windowId);
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  windowTabHistory.delete(windowId);
});

const getAdjacentTabId = async (
  windowId: number,
  tabIndex: number,
  direction: -1 | 1
): Promise<number | null> => {
  const tabs = await listWindowTabs(windowId);
  if (tabs.length === 0) {
    return null;
  }

  let nextCandidate: chrome.tabs.Tab | null = null;
  let wrapCandidate: chrome.tabs.Tab | null = null;

  for (const tab of tabs) {
    if (typeof tab.index !== "number") {
      continue;
    }

    if (direction === 1) {
      if (
        tab.index > tabIndex &&
        (!nextCandidate || tab.index < (nextCandidate.index ?? Number.POSITIVE_INFINITY))
      ) {
        nextCandidate = tab;
      }

      if (!wrapCandidate || tab.index < (wrapCandidate.index ?? Number.POSITIVE_INFINITY)) {
        wrapCandidate = tab;
      }
      continue;
    }

    if (
      tab.index < tabIndex &&
      (!nextCandidate || tab.index > (nextCandidate.index ?? Number.NEGATIVE_INFINITY))
    ) {
      nextCandidate = tab;
    }

    if (!wrapCandidate || tab.index > (wrapCandidate.index ?? Number.NEGATIVE_INFINITY)) {
      wrapCandidate = tab;
    }
  }

  return (nextCandidate ?? wrapCandidate)?.id ?? null;
};

const getBoundaryTabId = async (windowId: number, direction: -1 | 1): Promise<number | null> => {
  const tabs = await listWindowTabs(windowId);
  if (tabs.length === 0) {
    return null;
  }

  let candidate = tabs[0] ?? null;

  for (const tab of tabs) {
    if (!candidate) {
      candidate = tab;
      continue;
    }

    if (direction === -1 ? tab.index < candidate.index : tab.index > candidate.index) {
      candidate = tab;
    }
  }

  return candidate?.id ?? null;
};

const getMostRecentlyVisitedTabId = async (
  windowId: number,
  currentTabId: number
): Promise<number | null> => {
  const history = windowTabHistory.get(windowId);

  if (history?.previousTabId && history.previousTabId !== currentTabId) {
    return history.previousTabId;
  }

  const tabs = await listWindowTabs(windowId);
  let candidate: chrome.tabs.Tab | null = null;

  for (const tab of tabs) {
    if (tab.id === currentTabId || tab.active) {
      continue;
    }

    if ((tab.lastAccessed ?? 0) > (candidate?.lastAccessed ?? 0)) {
      candidate = tab;
    }
  }

  return candidate?.id ?? null;
};

const activateAdjacentTab: TabCommandHandler = async (sender, message) => {
  const windowId = getMessageWindowId(sender, message);
  const tabIndex = getMessageTabIndex(sender, message);
  if (typeof windowId !== "number" || typeof tabIndex !== "number") {
    return { ok: false };
  }

  const direction = message.command === "tab-go-prev" ? -1 : 1;
  const nextTabId = await getAdjacentTabId(windowId, tabIndex, direction);
  if (typeof nextTabId !== "number") {
    return { ok: false };
  }

  await chrome.tabs.update(nextTabId, { active: true });
  return { ok: true };
};

const activateBoundaryTab: TabCommandHandler = async (sender, message) => {
  const windowId = getMessageWindowId(sender, message);
  if (typeof windowId !== "number") {
    return { ok: false };
  }

  const targetTabId = await getBoundaryTabId(windowId, message.command === "first-tab" ? -1 : 1);
  if (typeof targetTabId !== "number") {
    return { ok: false };
  }

  await chrome.tabs.update(targetTabId, { active: true });
  return { ok: true };
};

const activatePreviousTab: TabCommandHandler = async (sender, message) => {
  const windowId = getMessageWindowId(sender, message);
  const currentTabId = getMessageTabId(sender, message);
  if (typeof windowId !== "number" || typeof currentTabId !== "number") {
    return { ok: false };
  }

  const previousTabId = await getMostRecentlyVisitedTabId(windowId, currentTabId);
  if (typeof previousTabId !== "number") {
    return { ok: false };
  }

  await chrome.tabs.update(previousTabId, { active: true });
  return { ok: true };
};

const createNewTab: TabCommandHandler = async (sender, message) => {
  const createProperties: chrome.tabs.CreateProperties = {
    active: true
  };
  const windowId = getMessageWindowId(sender, message);
  const tabIndex = getMessageTabIndex(sender, message);

  if (typeof windowId === "number") {
    createProperties.windowId = windowId;
  }

  if (typeof tabIndex === "number") {
    createProperties.index = tabIndex + 1;
  }

  await chrome.tabs.create(createProperties);
  return { ok: true };
};

const moveTab: TabCommandHandler = async (sender, message) => {
  const windowId = getMessageWindowId(sender, message);
  const tabId = getMessageTabId(sender, message);
  if (typeof windowId !== "number" || typeof tabId !== "number") {
    return { ok: false };
  }

  const tabs = await listWindowTabs(windowId);
  const currentTab = tabs.find((tab) => tab.id === tabId);
  if (!currentTab) {
    return { ok: false };
  }

  const samePinnedTabs = tabs.filter((tab) => tab.pinned === currentTab.pinned);
  if (samePinnedTabs.length === 0) {
    return { ok: false };
  }

  const minIndex = Math.min(...samePinnedTabs.map((tab) => tab.index));
  const maxIndex = Math.max(...samePinnedTabs.map((tab) => tab.index));
  const delta = message.command === "move-tab-left" ? -1 : 1;
  const targetIndex = Math.min(maxIndex, Math.max(minIndex, currentTab.index + delta));

  if (targetIndex === currentTab.index) {
    return { ok: true };
  }

  await chrome.tabs.move(tabId, { index: targetIndex });
  return { ok: true };
};

const duplicateCurrentTab: TabCommandHandler = async (sender, message) => {
  const tabId = getMessageTabId(sender, message);
  if (typeof tabId !== "number") {
    return { ok: false };
  }

  await chrome.tabs.duplicate(tabId);
  return { ok: true };
};

const duplicateCurrentTabOrigin: TabCommandHandler = async (sender, message) => {
  const tabId = getMessageTabId(sender, message);
  if (typeof tabId !== "number") {
    return { ok: false };
  }

  const sourceTab = await chrome.tabs.get(tabId);
  if (!sourceTab.url) {
    return { ok: false };
  }

  const createProperties: chrome.tabs.CreateProperties = {
    active: true,
    url: getBaseUrl(sourceTab.url)
  };
  const windowId = getMessageWindowId(sender, message);
  const tabIndex = getMessageTabIndex(sender, message);

  if (typeof windowId === "number") {
    createProperties.windowId = windowId;
  }

  if (typeof tabIndex === "number") {
    createProperties.index = tabIndex + 1;
  }

  await chrome.tabs.create(createProperties);
  return { ok: true };
};

const moveCurrentTabToNewWindow: TabCommandHandler = async (sender, message) => {
  const tabId = getMessageTabId(sender, message);
  if (typeof tabId !== "number") {
    return { ok: false };
  }

  const createdWindow = await chrome.windows.create({ tabId });
  return { ok: Boolean(createdWindow) };
};

const closeCurrentTab: TabCommandHandler = async (sender, message) => {
  const tabId = getMessageTabId(sender, message);
  if (typeof tabId !== "number") {
    return { ok: false };
  }

  await chrome.tabs.remove(tabId);
  return { ok: true };
};

const closeTabs: TabCommandHandler = async (sender, message) => {
  const windowId = getMessageWindowId(sender, message);
  const tabId = getMessageTabId(sender, message);
  const tabIndex = getMessageTabIndex(sender, message);
  if (typeof windowId !== "number" || typeof tabId !== "number" || typeof tabIndex !== "number") {
    return { ok: false };
  }

  const tabs = await listWindowTabs(windowId);
  const tabIdsToRemove = tabs
    .filter((tab) => {
      if (message.command === "close-tabs-other") {
        return tab.id !== tabId;
      }

      if (message.command === "close-tabs-left") {
        return tab.index < tabIndex;
      }

      return tab.index > tabIndex;
    })
    .map((tab) => tab.id);

  if (tabIdsToRemove.length === 0) {
    return { ok: true };
  }

  await chrome.tabs.remove(tabIdsToRemove);
  return { ok: true };
};

const restoreClosedTab: TabCommandHandler = async () => {
  const restoredSession = await chrome.sessions.restore();
  return { ok: Boolean(restoredSession) };
};

const reloadCurrentTab: TabCommandHandler = async (sender, message) => {
  const tabId = getMessageTabId(sender, message);
  if (typeof tabId !== "number") {
    return { ok: false };
  }

  if (message.command === "reload-current-tab-hard") {
    await chrome.tabs.reload(tabId, { bypassCache: true });
  } else {
    await chrome.tabs.reload(tabId);
  }

  return { ok: true };
};

const tabCommandHandlers: Record<TabCommandMessage["command"], TabCommandHandler> = {
  "tab-go-prev": activateAdjacentTab,
  "tab-go-next": activateAdjacentTab,
  "first-tab": activateBoundaryTab,
  "last-tab": activateBoundaryTab,
  "visit-previous-tab": activatePreviousTab,
  "move-tab-left": moveTab,
  "move-tab-right": moveTab,
  "create-new-tab": createNewTab,
  "duplicate-current-tab": duplicateCurrentTab,
  "duplicate-current-tab-origin": duplicateCurrentTabOrigin,
  "move-current-tab-to-new-window": moveCurrentTabToNewWindow,
  "close-current-tab": closeCurrentTab,
  "close-tabs-other": closeTabs,
  "close-tabs-left": closeTabs,
  "close-tabs-right": closeTabs,
  "restore-closed-tab": restoreClosedTab,
  "reload-current-tab": reloadCurrentTab,
  "reload-current-tab-hard": reloadCurrentTab
};

export const handleTabCommandMessage = async (
  sender: chrome.runtime.MessageSender,
  message: TabCommandMessage
): Promise<TabCommandResponse> => {
  const handler = tabCommandHandlers[message.command];
  if (!handler) {
    return { ok: false };
  }

  try {
    return await handler(sender, message);
  } catch {
    return { ok: false };
  }
};