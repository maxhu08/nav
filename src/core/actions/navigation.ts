import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";
import { resolveFollowDirectionTarget } from "~/src/core/utils/follow-page-target";

const resolveActionableElement = (element: Element): Element => {
  if (!(element instanceof HTMLElement)) {
    return element;
  }

  const actionableSelector =
    "a, area, button, input[type='button'], input[type='submit'], input[type='image'], [role='button'], [role='link'], [onclick]";

  const closestActionable = element.closest(actionableSelector);
  if (closestActionable) {
    return closestActionable;
  }

  const nestedActionable = element.querySelector(actionableSelector);
  return nestedActionable ?? element;
};

const dispatchFocusIndicator = (element: HTMLElement): void => {
  window.dispatchEvent(
    new CustomEvent(FOCUS_INDICATOR_EVENT, {
      detail: { element }
    })
  );
};

const followElement = (element: Element): boolean => {
  const actionableElement = resolveActionableElement(element);

  if (actionableElement instanceof HTMLLinkElement && actionableElement.href) {
    dispatchFocusIndicator(actionableElement);
    window.location.assign(actionableElement.href);
    return true;
  }

  if (actionableElement instanceof HTMLElement) {
    dispatchFocusIndicator(actionableElement);
    actionableElement.scrollIntoView({ block: "nearest", inline: "nearest" });
    actionableElement.click();
    return true;
  }

  if ("click" in actionableElement && typeof actionableElement.click === "function") {
    actionableElement.click();
    return true;
  }

  return false;
};

const followDirection = (rel: "prev" | "next"): boolean => {
  const target = resolveFollowDirectionTarget(rel);

  if (!target) {
    return false;
  }

  return followElement(target);
};

export const followPreviousPage = (): boolean => followDirection("prev");
export const followNextPage = (): boolean => followDirection("next");