import type { TabCommandResponse } from "~/src/shared/background-messages";

export const handleOpenBackgroundTabMessage = async (
  url: string,
  sender: chrome.runtime.MessageSender
): Promise<TabCommandResponse> => {
  try {
    await chrome.tabs.create({
      url,
      active: false,
      ...(sender.tab ? { windowId: sender.tab.windowId, index: sender.tab.index + 1 } : {})
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
};