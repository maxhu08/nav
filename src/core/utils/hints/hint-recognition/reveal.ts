import type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/model";

export const revealElementForHintCollection = (
  element: HTMLElement,
  seen: Set<HTMLElement>,
  _revealedElements: RevealedHintElement[]
): void => {
  if (seen.has(element)) {
    return;
  }

  seen.add(element);
};

export const revealHoverHintControls = (
  _mode: LinkMode,
  _revealedElements: RevealedHintElement[]
): void => {};

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