type TabCommand = "close-current-tab" | "create-new-tab" | "reload-current-tab";

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

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (
    !message ||
    typeof message !== "object" ||
    (message as { type?: string }).type !== "tab-command"
  ) {
    return false;
  }

  const typedMessage = message as TabCommandMessage;

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

  return false;
});
