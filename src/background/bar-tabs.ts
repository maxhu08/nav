import type {
  FetchTabSuggestionsResponse,
  TabCommandResponse
} from "~/src/shared/background-messages";

export const handleFetchTabSuggestionsMessage = async (
  sender: chrome.runtime.MessageSender
): Promise<FetchTabSuggestionsResponse> => {
  try {
    const tabs = await chrome.tabs.query({});
    return {
      ok: true,
      tabs: tabs
        .filter((tab) => tab.incognito === (sender.tab?.incognito ?? false))
        .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
        .flatMap((tab) =>
          typeof tab.id === "number"
            ? [
                {
                  id: tab.id,
                  title: tab.title ?? "",
                  url: tab.pendingUrl ?? tab.url ?? ""
                }
              ]
            : []
        )
    };
  } catch (error) {
    return { ok: false, tabs: [], error: error instanceof Error ? error.message : String(error) };
  }
};

export const handleActivateTabMessage = async (
  tabId: number,
  sender: chrome.runtime.MessageSender
): Promise<TabCommandResponse> => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.incognito !== (sender.tab?.incognito ?? false)) return { ok: false };
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    return { ok: true };
  } catch {
    return { ok: false };
  }
};