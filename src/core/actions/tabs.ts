import { getToastApi } from "~/src/core/utils/sonner";

export type TabCommand =
  | "tab-go-prev"
  | "tab-go-next"
  | "duplicate-current-tab"
  | "duplicate-current-tab-origin"
  | "move-current-tab-to-new-window"
  | "close-current-tab"
  | "create-new-tab"
  | "reload-current-tab"
  | "reload-current-tab-hard";

type TabCommandResponse = { ok: boolean };

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
    chrome.runtime.sendMessage(
      {
        type: "tab-command",
        command,
        ...tabContext
      },
      (response?: TabCommandResponse) => {
        if (response?.ok) {
          return;
        }

        const toast = getToastApi();
        const actionLabel =
          command === "tab-go-prev"
            ? "go to previous tab"
            : command === "tab-go-next"
              ? "go to next tab"
              : command === "duplicate-current-tab"
                ? "duplicate current tab"
                : command === "duplicate-current-tab-origin"
                  ? "duplicate current tab origin"
                  : command === "move-current-tab-to-new-window"
                    ? "move current tab to new window"
                    : command === "close-current-tab"
                      ? "close current tab"
                      : command === "create-new-tab"
                        ? "create new tab"
                        : command === "reload-current-tab"
                          ? "reload current tab"
                          : "hard reload current tab";

        toast?.error(`Could not ${actionLabel}`);
      }
    );
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