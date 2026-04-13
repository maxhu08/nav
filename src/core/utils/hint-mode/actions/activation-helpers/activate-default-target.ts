import { isEditableInputCandidate } from "~/src/core/utils/hint-mode/directive-recognition/shared";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";
import { dispatchFocusIndicator } from "~/src/core/utils/hint-mode/actions/activation-helpers/dispatch-focus-indicator";
import { dispatchSyntheticPressEvents } from "~/src/core/utils/hint-mode/actions/activation-helpers/dispatch-synthetic-events";
import { focusEditableTargetAtEnd } from "~/src/core/utils/hint-mode/actions/activation-helpers/focus-editable-target-at-end";
import { focusTargetElement } from "~/src/core/utils/hint-mode/actions/activation-helpers/focus-target-element";

const shouldFocusBeforeActivation = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable
  );
};

const shouldActivateByFocusingOnly = (element: HTMLElement): boolean => {
  return isEditableInputCandidate(element);
};

export const activateDefaultTarget = (target: HintTarget): boolean => {
  if (shouldActivateByFocusingOnly(target.element)) {
    return focusEditableTargetAtEnd(target.element);
  }

  if (shouldFocusBeforeActivation(target.element)) {
    focusTargetElement(target.element);
  }

  if (typeof target.element.click === "function") {
    if (!shouldFocusBeforeActivation(target.element)) {
      dispatchFocusIndicator(target.element);
    }

    dispatchSyntheticPressEvents(target.element);
    target.element.click();

    return true;
  }

  if (target.linkUrl) {
    dispatchFocusIndicator(target.element);
    window.location.assign(target.linkUrl);
    return true;
  }

  return false;
};