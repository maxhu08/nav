import { IMAGE_SELECTOR } from "~/src/core/utils/hint-mode/shared/constants";
import { collectElements } from "~/src/core/utils/hint-mode/collection/collect-elements";
import { isElementVisible } from "~/src/core/utils/hint-mode/collection/is-element-visible";
import {
  isChatGptHintContext,
  shouldSuppressChatGptDuplicateTarget
} from "~/src/core/utils/hint-mode/rendering/sites/chatgpt";
import type { HintActionMode } from "~/src/core/utils/hint-mode/shared/types";

type HintableElementState = {
  element: HTMLElement;
  possibleFalsePositive: boolean;
  secondClassCitizen: boolean;
};

const CLICKABLE_ROLES = new Set([
  "button",
  "tab",
  "link",
  "checkbox",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "radio",
  "textbox"
]);

const CONTENT_EDITABLE_VALUES = new Set(["", "contenteditable", "true"]);

const READONLY_SELECTABLE_INPUT_TYPES = new Set([
  "",
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "url"
]);

const HINTABLE_CANDIDATE_SELECTOR = [
  "a",
  "area",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "details",
  "object",
  "embed",
  "[role='button']",
  "[role='tab']",
  "[role='link']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[role='radio']",
  "[role='textbox']",
  "[role='searchbox']",
  "[role='combobox']",
  "[tabindex]",
  "[onclick]",
  "[jsaction]",
  "[contenteditable]",
  "[data-sidebar-item='true']",
  "[class*='button']",
  "[class*='Button']",
  "[class*='btn']",
  "[class*='Btn']"
].join(",");

const isViewportIntersectingRect = (rect: DOMRect): boolean => {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth &&
    rect.top <= window.innerHeight
  );
};

const hasClickableJsAction = (element: HTMLElement): boolean => {
  const rawValue = element.getAttribute("jsaction");
  if (!rawValue) {
    return false;
  }

  for (const rule of rawValue.split(";")) {
    const trimmedRule = rule.trim();
    if (trimmedRule.length === 0) {
      continue;
    }

    const segments = trimmedRule.split(":");
    if (segments.length < 1 || segments.length > 2) {
      continue;
    }

    const [eventType, namespace, actionName] =
      segments.length === 1
        ? ["click", ...segments[0].trim().split("."), "_"]
        : [segments[0].trim(), ...segments[1].trim().split("."), "_"];

    if (eventType === "click" && namespace !== "none" && actionName !== "_") {
      return true;
    }
  }

  return false;
};

const hasFalsePositiveButtonSignal = (element: HTMLElement): boolean => {
  const values = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("role"),
    element.textContent?.trim()
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  if (values.length > 0) {
    return true;
  }

  const tabIndexValue = element.getAttribute("tabindex");
  const tabIndex = tabIndexValue ? Number.parseInt(tabIndexValue, 10) : Number.NaN;
  return Number.isFinite(tabIndex) && tabIndex >= 0;
};

const isSelectableReadOnlyInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) {
    return false;
  }

  return READONLY_SELECTABLE_INPUT_TYPES.has(element.type.toLowerCase());
};

const hasClickableLabelControl = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLLabelElement) || !element.control) {
    return false;
  }

  const control = element.control;
  if (!(control instanceof HTMLElement) || control.hasAttribute("disabled")) {
    return false;
  }

  return !getHintableElementState(control).isClickable;
};

const hasNativeInteractiveLabelPeer = (element: HTMLElement): boolean => {
  const label = element.closest("label");
  if (!(label instanceof HTMLLabelElement)) {
    return false;
  }

  for (const candidate of label.querySelectorAll("a, button, [role='link'], [role='button']")) {
    if (!(candidate instanceof HTMLElement) || candidate === element) {
      continue;
    }

    return true;
  }

  return false;
};

const getHintableElementState = (
  element: HTMLElement
): {
  isClickable: boolean;
  possibleFalsePositive: boolean;
  secondClassCitizen: boolean;
} => {
  const ariaDisabled = element.getAttribute("aria-disabled")?.toLowerCase();
  if (ariaDisabled && ["", "true"].includes(ariaDisabled)) {
    return {
      isClickable: false,
      possibleFalsePositive: false,
      secondClassCitizen: false
    };
  }

  let isClickable = false;
  let possibleFalsePositive = false;
  let secondClassCitizen = false;

  if (element.matches("[data-sidebar-item='true']")) {
    isClickable = true;
  }

  if (element.hasAttribute("onclick")) {
    isClickable = true;
  } else {
    const role = element.getAttribute("role")?.toLowerCase();
    if (role && CLICKABLE_ROLES.has(role)) {
      isClickable = true;
    } else {
      const contentEditable = element.getAttribute("contentEditable")?.toLowerCase();
      if (contentEditable && CONTENT_EDITABLE_VALUES.has(contentEditable)) {
        isClickable = true;
      }
    }
  }

  if (!isClickable && hasClickableJsAction(element)) {
    isClickable = true;
  }

  switch (element.tagName.toLowerCase()) {
    case "a":
    case "area":
      isClickable = true;
      break;
    case "textarea":
      isClickable ||= !(
        element instanceof HTMLTextAreaElement &&
        (element.disabled || element.readOnly)
      );
      break;
    case "input":
      if (element instanceof HTMLInputElement) {
        isClickable ||= !(
          element.type.toLowerCase() === "hidden" ||
          element.disabled ||
          (element.readOnly && isSelectableReadOnlyInput(element))
        );
      }
      break;
    case "button":
      isClickable ||= !(element instanceof HTMLButtonElement && element.disabled);
      break;
    case "select":
      isClickable ||= !(element instanceof HTMLSelectElement && element.disabled);
      break;
    case "object":
    case "embed":
    case "details":
      isClickable = true;
      break;
    case "label":
      isClickable ||= hasClickableLabelControl(element);
      break;
  }

  if (!isClickable) {
    const className = element.getAttribute("class")?.toLowerCase();
    if (
      (className?.includes("button") || className?.includes("btn")) &&
      hasFalsePositiveButtonSignal(element)
    ) {
      isClickable = true;
      possibleFalsePositive = true;
    }
  }

  if (element.tagName.toLowerCase() === "span" && isClickable) {
    possibleFalsePositive = true;
  }

  const tabIndexValue = element.getAttribute("tabindex");
  const tabIndex = tabIndexValue ? Number.parseInt(tabIndexValue, 10) : -1;
  if (!isClickable && Number.isFinite(tabIndex) && tabIndex >= 0) {
    secondClassCitizen = true;
  }

  return {
    isClickable: isClickable || secondClassCitizen,
    possibleFalsePositive,
    secondClassCitizen
  };
};

const filterFalsePositives = (elements: HintableElementState[]): HintableElementState[] => {
  const reversed = [...elements].reverse();

  const filtered = reversed.filter((candidate, position) => {
    if (!candidate.possibleFalsePositive) {
      return true;
    }

    if (hasNativeInteractiveLabelPeer(candidate.element)) {
      return false;
    }

    const lookbackWindow = 6;
    let index = Math.max(0, position - lookbackWindow);

    while (index < position) {
      let ancestor: HTMLElement | null = reversed[index]?.element ?? null;
      for (let depth = 0; depth < 3 && ancestor; depth += 1) {
        ancestor = ancestor.parentElement;
        if (ancestor === candidate.element) {
          return false;
        }
      }

      index += 1;
    }

    return true;
  });

  return filtered.reverse();
};

const PREFERRED_NATIVE_INTERACTIVE_TAGS = new Set(["a", "button"]);

const hasLinkOrButtonSemantics = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  if (PREFERRED_NATIVE_INTERACTIVE_TAGS.has(tagName)) {
    return true;
  }

  const role = element.getAttribute("role")?.toLowerCase();
  return role === "link" || role === "button";
};

const hasExplicitDisclosureLabel = (element: HTMLElement): boolean => {
  const values = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.textContent,
    element.id,
    element.className
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  return /\b(show more|show less|expand|collapse|see more|see less|view more|view less)\b/.test(
    values
  );
};

const shouldSuppressNestedCandidate = (
  candidate: HintableElementState,
  ancestor: HintableElementState
): boolean => {
  if (candidate.possibleFalsePositive) {
    return true;
  }

  const ancestorTagName = ancestor.element.tagName.toLowerCase();
  if (!PREFERRED_NATIVE_INTERACTIVE_TAGS.has(ancestorTagName)) {
    return false;
  }

  const candidateTagName = candidate.element.tagName.toLowerCase();
  const candidateRole = candidate.element.getAttribute("role")?.toLowerCase();

  if (ancestorTagName === "a") {
    return candidateTagName === "a" || candidateRole === "link";
  }

  if (ancestorTagName === "button") {
    return candidateTagName === "button" || candidateRole === "button";
  }

  return false;
};

const shouldSuppressAncestorCandidate = (
  ancestor: HintableElementState,
  descendant: HintableElementState
): boolean => {
  const ancestorTagName = ancestor.element.tagName.toLowerCase();
  if (PREFERRED_NATIVE_INTERACTIVE_TAGS.has(ancestorTagName)) {
    return false;
  }

  if (ancestor.possibleFalsePositive && hasLinkOrButtonSemantics(descendant.element)) {
    return true;
  }

  if (
    hasExplicitDisclosureLabel(ancestor.element) &&
    hasExplicitDisclosureLabel(descendant.element) &&
    hasLinkOrButtonSemantics(descendant.element)
  ) {
    return true;
  }

  if (!ancestor.element.hasAttribute("aria-expanded")) {
    return false;
  }

  return hasLinkOrButtonSemantics(descendant.element);
};

const filterNestedCandidates = (elements: HintableElementState[]): HintableElementState[] => {
  const candidatesByElement = new Map(elements.map((candidate) => [candidate.element, candidate]));
  const suppressedAncestors = new Set<HTMLElement>();

  for (const candidate of elements) {
    let ancestor = candidate.element.parentElement;

    while (ancestor) {
      const ancestorCandidate = candidatesByElement.get(ancestor);
      if (ancestorCandidate && shouldSuppressAncestorCandidate(ancestorCandidate, candidate)) {
        suppressedAncestors.add(ancestorCandidate.element);
      }

      ancestor = ancestor.parentElement;
    }
  }

  return elements.filter((candidate) => {
    if (suppressedAncestors.has(candidate.element)) {
      return false;
    }

    let ancestor = candidate.element.parentElement;

    while (ancestor) {
      const ancestorCandidate = candidatesByElement.get(ancestor);
      if (ancestorCandidate && shouldSuppressNestedCandidate(candidate, ancestorCandidate)) {
        return false;
      }

      ancestor = ancestor.parentElement;
    }

    return true;
  });
};

export const getHintableElements = (mode: HintActionMode): HTMLElement[] => {
  if (mode === "yank-image" || mode === "yank-image-url") {
    const results: HTMLElement[] = [];
    collectElements(document, IMAGE_SELECTOR, results);

    const seen = new Set<HTMLElement>();
    return results.filter((element) => {
      if (seen.has(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (!isViewportIntersectingRect(rect) || !isElementVisible(element)) {
        return false;
      }

      seen.add(element);
      return true;
    });
  }

  const seen = new Set<HTMLElement>();
  const candidates: HintableElementState[] = [];
  const matchedElements: HTMLElement[] = [];
  const suppressChatGptDuplicates = isChatGptHintContext();

  collectElements(document.documentElement, HINTABLE_CANDIDATE_SELECTOR, matchedElements);

  for (const element of matchedElements) {
    if (seen.has(element)) {
      continue;
    }

    seen.add(element);
    const rect = element.getBoundingClientRect();
    if (!isViewportIntersectingRect(rect)) {
      continue;
    }

    const state = getHintableElementState(element);
    if (!state.isClickable || state.secondClassCitizen) {
      continue;
    }

    if (!isElementVisible(element)) {
      continue;
    }

    if (suppressChatGptDuplicates && shouldSuppressChatGptDuplicateTarget(element)) {
      continue;
    }

    candidates.push({
      element,
      possibleFalsePositive: state.possibleFalsePositive,
      secondClassCitizen: state.secondClassCitizen
    });
  }

  return filterNestedCandidates(filterFalsePositives(candidates)).map(
    (candidate) => candidate.element
  );
};