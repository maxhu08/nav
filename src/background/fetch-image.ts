import type { FetchImageResponse } from "~/src/shared/background-messages";

export const handleFetchImageMessage = async (url: string): Promise<FetchImageResponse> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false };
    }

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
      return { ok: false };
    }

    return {
      ok: true,
      bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
      mimeType: blob.type
    };
  } catch {
    return { ok: false };
  }
};