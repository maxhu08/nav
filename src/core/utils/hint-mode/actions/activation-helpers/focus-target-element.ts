import { dispatchFocusIndicator } from "~/src/core/utils/hint-mode/actions/activation-helpers/dispatch-focus-indicator";

export const focusTargetElement = (element: HTMLElement): void => {
  if (typeof element.focus !== "function") {
    return;
  }

  element.focus({ preventScroll: true });
  dispatchFocusIndicator(element);
};