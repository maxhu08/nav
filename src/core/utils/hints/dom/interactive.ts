import { isSelectableElement } from "~/src/core/utils/is-editable-target";
import {
  ACTIVATABLE_ROLES,
  INTERACTIVE_ARIA_ATTRIBUTES,
  INTERACTIVE_DATA_ATTRIBUTES
} from "~/src/core/utils/hints/dom/shared";
import { getDomDepth } from "~/src/core/utils/hints/dom/geometry";

export const getElementTabIndex = (element: HTMLElement): number | null => {
  const tabIndexValue = element.getAttribute("tabindex");
  if (tabIndexValue === null) {
    return null;
  }

  const tabIndex = Number.parseInt(tabIndexValue, 10);
  return Number.isNaN(tabIndex) ? null : tabIndex;
};

export const hasInteractiveRole = (element: HTMLElement): boolean => {
  const role = element.getAttribute("role")?.toLowerCase();
  return !!role && ACTIVATABLE_ROLES.has(role);
};

const hasInteractiveAriaState = (element: HTMLElement): boolean =>
  INTERACTIVE_ARIA_ATTRIBUTES.some((attributeName) => element.hasAttribute(attributeName));

const hasInteractiveDataState = (element: HTMLElement): boolean =>
  INTERACTIVE_DATA_ATTRIBUTES.some((attributeName) => element.hasAttribute(attributeName));

const hasDirectActionAttribute = (element: HTMLElement): boolean =>
  element.hasAttribute("onclick") || element.hasAttribute("jsaction");

const isClickableByTagName = (element: HTMLElement, tagName: string): boolean => {
  switch (tagName) {
    case "a":
    case "area":
    case "object":
    case "embed":
    case "summary":
      return true;
    case "button":
    case "select":
      return !element.hasAttribute("disabled");
    case "textarea":
      return !element.hasAttribute("disabled") && !element.hasAttribute("readonly");
    case "input": {
      const input = element as HTMLInputElement;
      return (
        input.type !== "hidden" &&
        !input.disabled &&
        !(input.readOnly && isSelectableElement(input))
      );
    }
    case "label": {
      const label = element as HTMLLabelElement;
      const control = label.control;
      return !!control && !("disabled" in control && control.disabled);
    }
    default:
      return false;
  }
};

export const isIntrinsicInteractiveElement = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "a" || tagName === "area") {
    return !!element.getAttribute("href");
  }

  return isClickableByTagName(element, tagName);
};

const isEditableHintTarget = (element: HTMLElement): boolean => {
  const contentEditable = element.getAttribute("contenteditable")?.toLowerCase();
  return !!contentEditable && ["", "contenteditable", "true"].includes(contentEditable);
};

export const getHintTargetPreference = (element: HTMLElement): number => {
  let score = 0;

  if (
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
    element.href
  ) {
    score += 500;
  }
  if (element instanceof HTMLButtonElement) {
    score += 450;
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    score += 425;
  }
  if (element instanceof HTMLLabelElement && element.control) {
    score += 400;
  }
  if (isSelectableElement(element)) {
    score += 350;
  }
  if (hasInteractiveRole(element)) {
    score += 250;
  }

  const tabIndex = getElementTabIndex(element);
  if (tabIndex !== null && tabIndex >= 0) {
    score += 125;
  }

  score += getDomDepth(element);
  return score;
};

const isCustomActivatableElement = (element: HTMLElement): boolean => {
  const tabIndex = getElementTabIndex(element);
  const isFocusable = tabIndex !== null && tabIndex >= 0;
  const hasInteractiveState = hasInteractiveAriaState(element) || hasInteractiveDataState(element);

  if (hasInteractiveRole(element)) {
    if (isFocusable || isEditableHintTarget(element) || hasInteractiveState) {
      return true;
    }

    return window.getComputedStyle(element).cursor === "pointer";
  }

  if (hasDirectActionAttribute(element)) {
    if (isFocusable || hasInteractiveState) {
      return true;
    }

    return window.getComputedStyle(element).cursor === "pointer";
  }

  if (!isFocusable) {
    return false;
  }

  if (hasInteractiveState) {
    return true;
  }

  return window.getComputedStyle(element).cursor === "pointer";
};

export const isActivatableElement = (element: HTMLElement): boolean => {
  if (isClickableByTagName(element, element.tagName.toLowerCase())) {
    return true;
  }

  if (isEditableHintTarget(element)) {
    return true;
  }

  return isCustomActivatableElement(element);
};