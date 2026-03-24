import { getBaseUrl } from "~/src/utils/url";
import type { TabCommandMessage, TabCommandResponse } from "~/src/shared/background-messages";

type TabCommandHandler = (
  sender: chrome.runtime.MessageSender,
  message: TabCommandMessage
) => Promise<TabCommandResponse>;

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

const getAdjacentTabId = async (
  windowId: number,
  tabIndex: number,
  direction: -1 | 1
): Promise<number | null> => {
  const tabs = await chrome.tabs.query({ windowId });
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
  "create-new-tab": createNewTab,
  "duplicate-current-tab": duplicateCurrentTab,
  "duplicate-current-tab-origin": duplicateCurrentTabOrigin,
  "move-current-tab-to-new-window": moveCurrentTabToNewWindow,
  "close-current-tab": closeCurrentTab,
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