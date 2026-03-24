import { getBaseUrl } from "~/src/utils/url";

type TabCommand =
  | "tab-go-prev"
  | "tab-go-next"
  | "duplicate-current-tab"
  | "duplicate-current-tab-origin"
  | "move-current-tab-to-new-window"
  | "close-current-tab"
  | "create-new-tab"
  | "reload-current-tab"
  | "reload-current-tab-hard";

type FetchImageMessage = {
  type: "fetch-image";
  url: string;
};

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

type FetchImageResponse = {
  ok: boolean;
  bytes?: number[];
  mimeType?: string;
};

type BridgeMessage =
  | {
      type: "frame-action";
      actionName: string;
    }
  | {
      type: "toast-proxy";
      content: string;
      description?: string;
      toastType?: "success" | "info" | "warning" | "error";
    };

const RUNTIME_BRIDGE_PORT_NAME = "nav-runtime-bridge";
const portsByTabId = new Map<number, Set<chrome.runtime.Port>>();

const removeBridgePort = (tabId: number, port: chrome.runtime.Port): void => {
  const ports = portsByTabId.get(tabId);
  if (!ports) {
    return;
  }

  ports.delete(port);
  if (ports.size === 0) {
    portsByTabId.delete(tabId);
  }
};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== RUNTIME_BRIDGE_PORT_NAME) {
    return;
  }

  const tabId = port.sender?.tab?.id;
  if (typeof tabId !== "number") {
    return;
  }

  const ports = portsByTabId.get(tabId) ?? new Set<chrome.runtime.Port>();
  ports.add(port);
  portsByTabId.set(tabId, ports);

  port.onDisconnect.addListener(() => {
    removeBridgePort(tabId, port);
  });

  port.onMessage.addListener((message: unknown) => {
    if (!message || typeof message !== "object") {
      return;
    }

    const typedMessage = message as Partial<BridgeMessage>;
    const currentPorts = portsByTabId.get(tabId);
    if (!currentPorts) {
      return;
    }

    if (typedMessage.type === "frame-action" && typeof typedMessage.actionName === "string") {
      for (const targetPort of currentPorts) {
        if (targetPort === port) {
          continue;
        }

        targetPort.postMessage({
          type: "frame-action",
          actionName: typedMessage.actionName
        } satisfies BridgeMessage);
      }

      return;
    }

    if (typedMessage.type === "toast-proxy" && typeof typedMessage.content === "string") {
      for (const targetPort of currentPorts) {
        if (targetPort.sender?.frameId !== 0 || targetPort === port) {
          continue;
        }

        targetPort.postMessage({
          type: "toast-proxy",
          content: typedMessage.content,
          description: typedMessage.description,
          toastType: typedMessage.toastType
        } satisfies BridgeMessage);
      }
    }
  });
});

const sendTabCommandResponse = (
  sendResponse: (response: TabCommandResponse) => void,
  ok: boolean
): void => {
  sendResponse({ ok });
};

const sendFetchImageResponse = (
  sendResponse: (response: FetchImageResponse) => void,
  response: FetchImageResponse
): void => {
  sendResponse(response);
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
      } else {
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
    }

    const nextTabId = (nextCandidate ?? wrapCandidate)?.id;

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
    message &&
    typeof message === "object" &&
    (message as { type?: string }).type === "fetch-image"
  ) {
    const typedMessage = message as FetchImageMessage;

    void fetch(typedMessage.url)
      .then(async (response) => {
        if (!response.ok) {
          sendFetchImageResponse(sendResponse, { ok: false });
          return;
        }

        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) {
          sendFetchImageResponse(sendResponse, { ok: false });
          return;
        }

        const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
        sendFetchImageResponse(sendResponse, {
          ok: true,
          bytes,
          mimeType: blob.type
        });
      })
      .catch(() => {
        sendFetchImageResponse(sendResponse, { ok: false });
      });

    return true;
  }

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

  if (typedMessage.command === "duplicate-current-tab-origin") {
    const tabId = typedMessage.tabId ?? sender.tab?.id;
    const windowId = typedMessage.windowId ?? sender.tab?.windowId;
    const tabIndex = typedMessage.tabIndex ?? sender.tab?.index;

    if (typeof tabId !== "number") {
      sendTabCommandResponse(sendResponse, false);
      return false;
    }

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab?.url) {
        sendTabCommandResponse(sendResponse, false);
        return;
      }

      const createProperties: chrome.tabs.CreateProperties = {
        active: true,
        url: getBaseUrl(tab.url)
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
    });

    return true;
  }

  if (typedMessage.command === "move-current-tab-to-new-window") {
    const tabId = typedMessage.tabId ?? sender.tab?.id;

    if (typeof tabId !== "number") {
      sendTabCommandResponse(sendResponse, false);
      return false;
    }

    chrome.windows.create({ tabId }, (createdWindow) => {
      sendTabCommandResponse(sendResponse, !chrome.runtime.lastError && Boolean(createdWindow));
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