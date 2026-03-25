import { isActivatableElement } from "~/src/core/utils/hints/dom";
import type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/model";

const HOVER_HINT_CONTAINER_SELECTOR = [
  "[data-playbutton='hover']",
  "[data-actions='hover']",
  "[aria-label='Response actions']",
  "[aria-label*='actions' i][role='group']",
  "[class*='turn-messages' i] [aria-label*='actions' i]"
].join(",");
const HOVER_HINT_INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "[role]",
  "[tabindex]",
  "[onclick]",
  "[jsaction]"
].join(",");
const HOVER_HINT_PLAY_CONTROL_PATTERNS = [/\bplay\b/i, /\bpause\b/i, /\bresume\b/i, /\bpreview\b/i];
const HOVER_HINT_ACTION_CONTROL_PATTERNS = [
  /\bcopy\b/i,
  /\bgood response\b/i,
  /\bbad response\b/i,
  /\bshare\b/i,
  /\bmore actions\b/i,
  /\bswitch model\b/i,
  /\bturn-action\b/i,
  /\bresponse actions\b/i
];
const TRAILING_MENU_CONTROL_SELECTOR = [
  "button[aria-haspopup='menu']",
  "[role='button'][aria-haspopup='menu']",
  "button[data-trailing-button]",
  "[role='button'][data-trailing-button]"
].join(",");
const TRAILING_MENU_CONTROL_PATTERNS = [
  /\b(open|show|view|toggle)\b.*\b(options?|actions?|menu)\b/i,
  /\b(options?|actions?)\b.*\b(open|show|view|toggle)\b/i,
  /\bmore\b/i,
  /\boverflow\b/i,
  /\bellipsis\b/i,
  /\btrailing\b/i
];
const COMPOSITE_ROW_ANCESTOR_SELECTOR = [
  "a[href]",
  "[role='link']",
  "[tabindex]:not([tabindex='-1']):not([role='group'])"
].join(",");

const getJoinedAttributeText = (element: HTMLElement, attributeNames: string[]): string =>
  attributeNames
    .map((name) => element.getAttribute(name))
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");

const textMatchesAnyPattern = (text: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

const hasHoverPlayControlSignal = (element: HTMLElement): boolean => {
  const attributeText = getJoinedAttributeText(element, [
    "aria-label",
    "title",
    "data-testid",
    "data-test-id",
    "class",
    "name"
  ]);

  return textMatchesAnyPattern(attributeText, HOVER_HINT_PLAY_CONTROL_PATTERNS);
};

const hasHoverActionControlSignal = (element: HTMLElement): boolean => {
  const attributeText = getJoinedAttributeText(element, [
    "aria-label",
    "title",
    "data-testid",
    "data-test-id",
    "class",
    "name"
  ]);

  return textMatchesAnyPattern(attributeText, HOVER_HINT_ACTION_CONTROL_PATTERNS);
};

const hasTrailingMenuControlSignal = (element: HTMLElement): boolean => {
  const attributeText = getJoinedAttributeText(element, [
    "aria-label",
    "title",
    "data-testid",
    "data-test-id",
    "class",
    "name",
    "id"
  ]);

  return (
    element.hasAttribute("data-trailing-button") ||
    textMatchesAnyPattern(attributeText, TRAILING_MENU_CONTROL_PATTERNS)
  );
};

const getCompositeRowAncestor = (element: HTMLElement): HTMLElement | null => {
  const ancestor = element.parentElement?.closest(COMPOSITE_ROW_ANCESTOR_SELECTOR);
  return ancestor instanceof HTMLElement && ancestor !== element ? ancestor : null;
};

export const revealElementForHintCollection = (
  element: HTMLElement,
  seen: Set<HTMLElement>,
  revealedElements: RevealedHintElement[]
): void => {
  if (seen.has(element)) {
    return;
  }

  seen.add(element);
  revealedElements.push({
    element,
    inlineStyle: element.getAttribute("style")
  });

  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === "none") {
    element.style.setProperty("display", "revert", "important");
  }

  element.style.setProperty("opacity", "1", "important");
  element.style.setProperty("visibility", "visible", "important");
  element.style.setProperty("pointer-events", "auto", "important");
  element.style.setProperty("overflow", "visible", "important");
  element.style.setProperty("max-width", "none", "important");
  element.style.setProperty("max-height", "none", "important");
  element.style.setProperty("clip-path", "none", "important");

  if (computedStyle.width === "0px") {
    element.style.setProperty("width", "max-content", "important");
    element.style.setProperty("min-width", "max-content", "important");
  }

  if (computedStyle.height === "0px") {
    element.style.setProperty("height", "max-content", "important");
    element.style.setProperty("min-height", "max-content", "important");
  }
};

export const revealHoverHintControls = (
  mode: LinkMode,
  revealedElements: RevealedHintElement[]
): void => {
  if (mode === "copy-link" || mode === "copy-image") {
    return;
  }

  const seen = new Set<HTMLElement>();

  for (const container of Array.from(
    document.querySelectorAll<HTMLElement>(HOVER_HINT_CONTAINER_SELECTOR)
  )) {
    for (const candidate of Array.from(
      container.querySelectorAll<HTMLElement>(HOVER_HINT_INTERACTIVE_SELECTOR)
    )) {
      if (
        !isActivatableElement(candidate) ||
        (!hasHoverPlayControlSignal(candidate) && !hasHoverActionControlSignal(candidate))
      ) {
        continue;
      }

      let current: HTMLElement | null = candidate;

      while (current && container.contains(current)) {
        revealElementForHintCollection(current, seen, revealedElements);

        if (current === container) {
          break;
        }

        current = current.parentElement;
      }
    }
  }

  for (const candidate of Array.from(
    document.querySelectorAll<HTMLElement>(TRAILING_MENU_CONTROL_SELECTOR)
  )) {
    if (!isActivatableElement(candidate) || !hasTrailingMenuControlSignal(candidate)) {
      continue;
    }

    const rowAncestor = getCompositeRowAncestor(candidate);
    if (!rowAncestor) {
      continue;
    }

    let current: HTMLElement | null = candidate;

    while (current) {
      revealElementForHintCollection(current, seen, revealedElements);

      if (current === rowAncestor) {
        break;
      }

      current = current.parentElement;
    }
  }
};

export const restoreRevealedHintControls = (revealedElements: RevealedHintElement[]): void => {
  for (const { element, inlineStyle } of revealedElements) {
    if (inlineStyle === null) {
      element.removeAttribute("style");
      continue;
    }

    element.setAttribute("style", inlineStyle);
  }

  revealedElements.length = 0;
};