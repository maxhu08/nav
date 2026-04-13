import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";

export const dispatchFocusIndicator = (element: HTMLElement): void => {
  window.dispatchEvent(
    new CustomEvent(FOCUS_INDICATOR_EVENT, {
      detail: { element }
    })
  );
};