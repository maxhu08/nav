import { isActivatableElement } from "~/src/core/utils/hints/dom";
import type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/model";

const HOVER_HINT_CONTAINER_SELECTOR = ["[data-playbutton='hover']", "[data-actions='hover']"].join(
  ","
);
const HOVER_HINT_INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "[role]",
  "[tabindex]",
  "[onclick]",
  "[jsaction]"
].join(",");
const HOVER_HINT_PLAY_CONTROL_PATTERNS = [/\bplay\b/i, /\bpause\b/i, /\bresume\b/i, /\bpreview\b/i];

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
      if (!isActivatableElement(candidate) || !hasHoverPlayControlSignal(candidate)) {
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