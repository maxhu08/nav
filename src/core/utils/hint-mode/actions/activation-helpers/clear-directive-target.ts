import { focusTargetElement } from "~/src/core/utils/hint-mode/actions/activation-helpers/focus-target-element";

const dispatchTextInputEvents = (element: HTMLElement): void => {
  element.dispatchEvent(new window.Event("input", { bubbles: true, cancelable: false }));
  element.dispatchEvent(new window.Event("change", { bubbles: true, cancelable: false }));
};

export const clearDirectiveTarget = (element: HTMLElement): boolean => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.readOnly || element.disabled) {
      return false;
    }

    element.value = "";
    dispatchTextInputEvents(element);
    focusTargetElement(element);
    if (typeof element.setSelectionRange === "function") {
      element.setSelectionRange(0, 0);
    }
    return true;
  }

  if (element.isContentEditable) {
    element.textContent = "";
    dispatchTextInputEvents(element);
    focusTargetElement(element);
    return true;
  }

  return false;
};