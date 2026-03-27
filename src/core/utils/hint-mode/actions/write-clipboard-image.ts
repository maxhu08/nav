import type { FetchImageMessage, FetchImageResponse } from "~/src/shared/background-messages";

export const writeClipboardImage = async (url: string): Promise<boolean> => {
  try {
    const response = await new Promise<FetchImageResponse>((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "fetch-image",
          url
        } satisfies FetchImageMessage,
        (result?: FetchImageResponse) => {
          resolve(result ?? { ok: false });
        }
      );
    });

    if (
      !response.ok ||
      !response.bytes ||
      !response.mimeType ||
      typeof ClipboardItem === "undefined"
    ) {
      return false;
    }

    const blob = new Blob([new Uint8Array(response.bytes)], { type: response.mimeType });
    await navigator.clipboard.write([new ClipboardItem({ [response.mimeType]: blob })]);
    return true;
  } catch {
    return false;
  }
};