import { showHintToastError } from "~/src/core/utils/hint-mode/actions/show-hint-toast-error";
import { showHintToastSuccess } from "~/src/core/utils/hint-mode/actions/show-hint-toast-success";
import { writeClipboardImage } from "~/src/core/utils/hint-mode/actions/write-clipboard-image";
import { writeClipboardText } from "~/src/core/utils/hint-mode/actions/write-clipboard-text";

export const activateClipboardTextTarget = (
  value: string | null,
  successTitle: string,
  errorTitle: string,
  errorMessage: string
): boolean => {
  if (!value) {
    return false;
  }

  void writeClipboardText(value).then((didCopy) => {
    if (didCopy) {
      showHintToastSuccess(successTitle, value);
    } else {
      showHintToastError(errorTitle, errorMessage);
    }
  });

  return true;
};

export const activateClipboardImageTarget = (imageUrl: string | null): boolean => {
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
};