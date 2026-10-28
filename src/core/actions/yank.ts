import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";
import { getCleanUrl, getNormalizedUrl } from "~/src/utils/url";
import { writeClipboardText } from "~/src/core/utils/hint-mode/actions/write-clipboard-text";

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

  void writeClipboardText(currentUrl).then((didCopy) => {
    if (didCopy) {
      showYankToast("success", "Current tab URL yanked.", currentUrl);
      return;
    }

    showYankToast("error", "Could not yank current tab URL.", "Clipboard access was denied.");
  });

  return true;
};

export const yankCurrentTabUrlClean = (): boolean => {
  const currentUrl = getCleanCurrentUrl();

  void writeClipboardText(currentUrl).then((didCopy) => {
    if (didCopy) {
      showYankToast("success", "Clean current tab URL yanked.", currentUrl);
      return;
    }

    showYankToast("error", "Could not yank clean current tab URL.", "Clipboard access was denied.");
  });

  return true;
};

export const yankLinkUrl = (): boolean => {
  showYankToast("error", "Could not yank link URL.", "Hint-based selection is unavailable.");
  return false;
};

export const yankImage = (): boolean => {
  showYankToast("error", "Could not yank image.", "Hint-based selection is unavailable.");
  return false;
};

export const yankImageUrl = (): boolean => {
  showYankToast("error", "Could not yank image URL.", "Hint-based selection is unavailable.");
  return false;
};