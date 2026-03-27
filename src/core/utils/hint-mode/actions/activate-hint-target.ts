import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";
import { showHintToastError } from "~/src/core/utils/hint-mode/actions/show-hint-toast-error";
import { showHintToastSuccess } from "~/src/core/utils/hint-mode/actions/show-hint-toast-success";
import type { HintActionMode, HintTarget } from "~/src/core/utils/hint-mode/shared/types";
import { writeClipboardImage } from "~/src/core/utils/hint-mode/actions/write-clipboard-image";
import { writeClipboardText } from "~/src/core/utils/hint-mode/actions/write-clipboard-text";

export const activateHintTarget = (mode: HintActionMode, target: HintTarget): boolean => {
  if (mode === "yank-link-url") {
    const url = target.linkUrl;
    if (!url) {
      return false;
    }

    void writeClipboardText(url).then((didCopy) => {
      if (didCopy) {
        showHintToastSuccess("Link URL yanked", url);
      } else {
        showHintToastError("Could not yank link URL", "Clipboard access was denied.");
      }
    });
    return true;
  }

  if (mode === "yank-image-url") {
    const imageUrl = target.imageUrl;
    if (!imageUrl) {
      return false;
    }

    void writeClipboardText(imageUrl).then((didCopy) => {
      if (didCopy) {
        showHintToastSuccess("Image URL yanked", imageUrl);
      } else {
        showHintToastError("Could not yank image URL", "Clipboard access was denied.");
      }
    });
    return true;
  }

  if (mode === "yank-image") {
    const imageUrl = target.imageUrl;
    if (!imageUrl) {
      return false;
    }

    void writeClipboardImage(imageUrl).then((didCopy) => {
      if (didCopy) {
        showHintToastSuccess("Image yanked", imageUrl);
      } else {
        showHintToastError("Could not yank image", "Clipboard access was denied or unsupported.");
      }
    });
    return true;
  }

  if (mode === "new-tab" && target.linkUrl) {
    const newWindow = window.open(target.linkUrl, "_blank", "noopener,noreferrer");
    if (newWindow) {
      return true;
    }
  }

  if (typeof target.element.focus === "function") {
    target.element.focus({ preventScroll: true });
    window.dispatchEvent(
      new CustomEvent(FOCUS_INDICATOR_EVENT, {
        detail: { element: target.element }
      })
    );
  }

  if (typeof target.element.click === "function") {
    target.element.click();
    return true;
  }

  if (target.linkUrl) {
    window.location.assign(target.linkUrl);
    return true;
  }

  return false;
};