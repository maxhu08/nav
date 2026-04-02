import { getToastApi } from "~/src/core/utils/sonner";
import type { TabCommandMessage, TabCommandResponse } from "~/src/shared/background-messages";

export type TabCommand =
  | "tab-go-prev"
  | "tab-go-next"
  | "first-tab"
  | "last-tab"
  | "visit-previous-tab"
  | "move-tab-left"
  | "move-tab-right"
  | "duplicate-current-tab"
  | "duplicate-current-tab-origin"
  | "move-current-tab-to-new-window"
  | "close-current-tab"
  | "close-tabs-other"
  | "close-tabs-left"
  | "close-tabs-right"
  | "create-new-tab"
  | "restore-closed-tab"
  | "reload-current-tab"
  | "reload-current-tab-hard";

const TAB_COMMAND_FAILURE_LABELS: Record<TabCommand, string> = {
  "tab-go-prev": "go to previous tab",
  "tab-go-next": "go to next tab",
  "first-tab": "go to first tab",
  "last-tab": "go to last tab",
  "visit-previous-tab": "visit previous tab",
  "move-tab-left": "move tab left",
  "move-tab-right": "move tab right",
  "duplicate-current-tab": "duplicate current tab",
  "duplicate-current-tab-origin": "duplicate current tab origin",
  "move-current-tab-to-new-window": "move current tab to new window",
  "close-current-tab": "close current tab",
  "close-tabs-other": "close other tabs",
  "close-tabs-left": "close tabs to the left",
  "close-tabs-right": "close tabs to the right",
  "create-new-tab": "create new tab",
  "restore-closed-tab": "restore closed tab",
  "reload-current-tab": "reload current tab",
  "reload-current-tab-hard": "hard reload current tab"
};

const getCurrentExtensionPageTabContext = async (): Promise<{
  tabId?: number;
  tabIndex?: number;
  windowId?: number;
}> => {
  if (typeof chrome.tabs?.getCurrent !== "function") {
    return {};
  }

  return new Promise((resolve) => {
    chrome.tabs.getCurrent((tab) => {
      if (chrome.runtime.lastError || !tab) {
        resolve({});
        return;
      }

      resolve({
        tabId: tab.id,
        tabIndex: tab.index,
        windowId: tab.windowId
      });
    });
  });
};

const runTabCommand = (command: TabCommand): boolean => {
  void getCurrentExtensionPageTabContext().then((tabContext) => {
    const message: TabCommandMessage = {
      type: "tab-command",
      command,
      ...tabContext
    };

    chrome.runtime.sendMessage(message, (response?: TabCommandResponse) => {
      if (response?.ok) {
        return;
      }

      const toast = getToastApi();

      toast?.error(`Could not ${TAB_COMMAND_FAILURE_LABELS[command]}`);
    });
  });

  return true;
};

export const createTabCommandAction = (command: TabCommand): (() => boolean) => {
  return () => runTabCommand(command);
};

const canNavigateHistory = (offset: number): boolean => {
  const navigationApi = (
    window as Window & {
      navigation?: {
        canGoBack?: boolean;
        canGoForward?: boolean;
      };
    }
  ).navigation;

  if (offset < 0) {
    if (typeof navigationApi?.canGoBack === "boolean") {
      return navigationApi.canGoBack;
    }

    return window.history.length > 1;
  }

  if (offset > 0) {
    if (typeof navigationApi?.canGoForward === "boolean") {
      return navigationApi.canGoForward;
    }

    return false;
  }

  return false;
};

export const goHistory = (offset: number): boolean => {
  if (!canNavigateHistory(offset)) {
    return false;
  }

  window.history.go(offset);
  return true;
};