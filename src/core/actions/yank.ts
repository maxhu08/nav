import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";
import { getCleanUrl, getNormalizedUrl } from "~/src/utils/url";

const writeClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }
};

const getNormalizedCurrentUrl = (): string => getNormalizedUrl(window.location.href);
const getCleanCurrentUrl = (): string => getCleanUrl(window.location.href);

const showYankToast = (type: "success" | "error", message: string, description: string): void => {
  ensureToastWrapper();
  const toast = getToastApi();

  if (type === "success") {
    toast?.success(message, { description });
    return;
  }

  toast?.error(message, { description });
};

export const yankCurrentTabUrl = (): boolean => {
  const currentUrl = getNormalizedCurrentUrl();

  void writeClipboard(currentUrl).then((didCopy) => {
    if (didCopy) {
      showYankToast("success", "Current tab URL yanked", currentUrl);
      return;
    }

    showYankToast("error", "Could not yank current tab URL", "Clipboard access was denied.");
  });

  return true;
};

export const yankCurrentTabUrlClean = (): boolean => {
  const currentUrl = getCleanCurrentUrl();

  void writeClipboard(currentUrl).then((didCopy) => {
    if (didCopy) {
      showYankToast("success", "Clean current tab URL yanked", currentUrl);
      return;
    }

    showYankToast("error", "Could not yank clean current tab URL", "Clipboard access was denied.");
  });

  return true;
};

export const yankLinkUrl = (): boolean => {
  showYankToast("error", "Could not yank link URL", "Hint-based selection is unavailable.");
  return false;
};

export const yankImage = (): boolean => {
  showYankToast("error", "Could not yank image", "Hint-based selection is unavailable.");
  return false;
};

export const yankImageUrl = (): boolean => {
  showYankToast("error", "Could not yank image URL", "Hint-based selection is unavailable.");
  return false;
};