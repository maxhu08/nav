import { isHintable, isVisibleHintTarget } from "~/src/core/utils/hints/dom";
import type { LinkMode } from "~/src/core/utils/hints/model";
import {
  createHintCollectionContext,
  dedupeCollectedHintTargets
} from "~/src/core/utils/hints/hint-recognition/dedupe";

const HINT_SELECTORS_COPY_LINK = "a[href],area[href]";
const HINT_SELECTORS_COPY_IMAGE = "img";

export const HINT_SELECTORS_DEFAULT = [
  "a[href]",
  "area[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "object",
  "embed",
  "label",
  "summary",
  "[onclick]",
  "[role]",
  "[tabindex]",
  "[contenteditable='true']",
  "[contenteditable='']",
  "[jsaction]"
].join(",");

const getHintSelector = (mode: LinkMode): string => {
  if (mode === "copy-link" || mode === "new-tab") {
    return HINT_SELECTORS_COPY_LINK;
  }

  if (mode === "copy-image") {
    return HINT_SELECTORS_COPY_IMAGE;
  }

  return HINT_SELECTORS_DEFAULT;
};

const isEligibleHintTarget = (element: HTMLElement, mode: LinkMode): boolean => {
  if (mode === "copy-image") {
    return (
      element instanceof HTMLImageElement &&
      !!(element.currentSrc || element.src) &&
      isVisibleHintTarget(element)
    );
  }

  return isHintable(element);
};

export const getHintableElements = (mode: LinkMode): HTMLElement[] => {
  const selector = getHintSelector(mode);
  const { getRect, getIdentity, getDepth, getPreference } = createHintCollectionContext();
  const elements: HTMLElement[] = [];

  for (const element of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    if (isEligibleHintTarget(element, mode)) {
      elements.push(element);
    }
  }

  const uniqueElements = dedupeCollectedHintTargets(elements, {
    getRect,
    getIdentity,
    getDepth,
    getPreference
  });

  uniqueElements.sort((leftElement, rightElement) => {
    const leftRect = getRect(leftElement);
    const rightRect = getRect(rightElement);

    if (!leftRect || !rightRect) {
      return 0;
    }

    if (leftRect.top !== rightRect.top) {
      return leftRect.top - rightRect.top;
    }

    if (leftRect.left !== rightRect.left) {
      return leftRect.left - rightRect.left;
    }

    return getDepth(leftElement) - getDepth(rightElement);
  });

  return uniqueElements;
};