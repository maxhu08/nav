type TabCommand =
  | "tab-go-prev"
  | "tab-go-next"
  | "duplicate-current-tab"
  | "close-current-tab"
  | "create-new-tab"
  | "reload-current-tab"
  | "reload-current-tab-hard";

type TabCommandMessage = {
  type: "tab-command";
  command: TabCommand;
  tabId?: number;
  tabIndex?: number;
  windowId?: number;
};

type TabCommandResponse = {
  ok: boolean;
};

const sendTabCommandResponse = (
  sendResponse: (response: TabCommandResponse) => void,
  ok: boolean
): void => {
  sendResponse({ ok });
};

const activateAdjacentTab = (
  sender: chrome.runtime.MessageSender,
  typedMessage: TabCommandMessage,
  direction: -1 | 1,
  sendResponse: (response: TabCommandResponse) => void
): boolean => {
  const windowId = typedMessage.windowId ?? sender.tab?.windowId;
  const tabIndex = typedMessage.tabIndex ?? sender.tab?.index;

  if (typeof windowId !== "number" || typeof tabIndex !== "number") {
    sendTabCommandResponse(sendResponse, false);
    return false;
  }

  chrome.tabs.query({ windowId }, (tabs) => {
    if (chrome.runtime.lastError || tabs.length === 0) {
      sendTabCommandResponse(sendResponse, false);
      return;
    }

    const sortedTabs = [...tabs].sort((firstTab, secondTab) => firstTab.index - secondTab.index);
    const currentTabPosition = sortedTabs.findIndex((tab) => tab.index === tabIndex);

    if (currentTabPosition === -1) {
      sendTabCommandResponse(sendResponse, false);
      return;
    }

    const nextTabPosition =
      (currentTabPosition + direction + sortedTabs.length) % sortedTabs.length;
    const nextTabId = sortedTabs[nextTabPosition]?.id;

    if (typeof nextTabId !== "number") {
      sendTabCommandResponse(sendResponse, false);
      return;
    }

    chrome.tabs.update(nextTabId, { active: true }, () => {
      sendTabCommandResponse(sendResponse, !chrome.runtime.lastError);
    });
  });

  return true;
};

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (
    !message ||
    typeof message !== "object" ||
    (message as { type?: string }).type !== "tab-command"
  ) {
    return false;
  }

  const typedMessage = message as TabCommandMessage;

  if (typedMessage.command === "tab-go-prev") {
    return activateAdjacentTab(sender, typedMessage, -1, sendResponse);
  }

  if (typedMessage.command === "tab-go-next") {
    return activateAdjacentTab(sender, typedMessage, 1, sendResponse);
  }

  if (typedMessage.command === "create-new-tab") {
    const windowId = typedMessage.windowId ?? sender.tab?.windowId;
    const tabIndex = typedMessage.tabIndex ?? sender.tab?.index;
    const createProperties: chrome.tabs.CreateProperties = {
      active: true
    };

    if (typeof windowId === "number") {
      createProperties.windowId = windowId;
    }

    if (typeof tabIndex === "number") {
      createProperties.index = tabIndex + 1;
    }

    chrome.tabs.create(createProperties, () => {
      sendTabCommandResponse(sendResponse, !chrome.runtime.lastError);
    });

    return true;
  }

  if (typedMessage.command === "duplicate-current-tab") {
    const tabId = typedMessage.tabId ?? sender.tab?.id;

    if (typeof tabId !== "number") {
      sendTabCommandResponse(sendResponse, false);
      return false;
    }

    chrome.tabs.duplicate(tabId, () => {
      sendTabCommandResponse(sendResponse, !chrome.runtime.lastError);
    });

    return true;
  }

  if (typedMessage.command === "close-current-tab") {
    const tabId = typedMessage.tabId ?? sender.tab?.id;

    if (typeof tabId !== "number") {
      sendTabCommandResponse(sendResponse, false);
      return false;
    }

    chrome.tabs.remove(tabId, () => {
      sendTabCommandResponse(sendResponse, !chrome.runtime.lastError);
    });

    return true;
  }

  if (typedMessage.command === "reload-current-tab") {
    const tabId = typedMessage.tabId ?? sender.tab?.id;

    if (typeof tabId !== "number") {
      sendTabCommandResponse(sendResponse, false);
      return false;
    }

    chrome.tabs.reload(tabId, () => {
      sendTabCommandResponse(sendResponse, !chrome.runtime.lastError);
    });

    return true;
  }

  if (typedMessage.command === "reload-current-tab-hard") {
    const tabId = typedMessage.tabId ?? sender.tab?.id;

    if (typeof tabId !== "number") {
      sendTabCommandResponse(sendResponse, false);
      return false;
    }

    chrome.tabs.reload(tabId, { bypassCache: true }, () => {
      sendTabCommandResponse(sendResponse, !chrome.runtime.lastError);
    });

    return true;
  }

  return false;
});
