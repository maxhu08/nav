import { focusTargetElement } from "~/src/core/utils/hint-mode/actions/activation-helpers/focus-target-element";

export const focusEditableTargetAtEnd = (element: HTMLElement): boolean => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.disabled || element.readOnly) {
      return false;
    }

    focusTargetElement(element);

    if (typeof element.setSelectionRange === "function") {
      const caretPosition = element.value.length;
      element.setSelectionRange(caretPosition, caretPosition);
    }

    return true;
  }

  if (element.isContentEditable) {
    focusTargetElement(element);

    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    return true;
  }

  focusTargetElement(element);
  return true;
};