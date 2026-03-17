import {
  createHintVisibilityContext,
  getElementTabIndex,
  hasInteractiveRole
} from "~/src/core/utils/hints/dom";
import type { LinkMode } from "~/src/core/utils/hints/model";
import {
  createHintCollectionContext,
  dedupeCollectedHintTargets
} from "~/src/core/utils/hints/hint-recognition/dedupe";

const HINT_SELECTORS_COPY_LINK = "a[href],area[href]";
const HINT_SELECTORS_COPY_IMAGE = "img";
const HINT_SELECTORS_DEFAULT_STRONG = [
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
  "[contenteditable='true']",
  "[contenteditable='']"
].join(",");
const HINT_SELECTORS_DEFAULT_WEAK = ["[onclick]", "[role]", "[tabindex]", "[jsaction]"].join(",");

export const HINT_SELECTORS_DEFAULT = [
  HINT_SELECTORS_DEFAULT_STRONG,
  HINT_SELECTORS_DEFAULT_WEAK
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

const hasWeakHintSignal = (element: HTMLElement): boolean => {
  if (hasInteractiveRole(element)) {
    return true;
  }

  const tabIndex = getElementTabIndex(element);
  if (tabIndex !== null && tabIndex >= 0) {
    return true;
  }

  return element.hasAttribute("onclick") || element.hasAttribute("jsaction");
};

const isEligibleHintTarget = (
  element: HTMLElement,
  mode: LinkMode,
  visibility: ReturnType<typeof createHintVisibilityContext>
): boolean => {
  if (mode === "copy-image") {
    return (
      element instanceof HTMLImageElement &&
      !!(element.currentSrc || element.src) &&
      visibility.isVisibleHintTarget(element)
    );
  }

  return visibility.isHintable(element);
};

const appendEligibleElements = (
  target: HTMLElement[],
  selector: string,
  mode: LinkMode,
  seen: Set<HTMLElement>,
  visibility: ReturnType<typeof createHintVisibilityContext>,
  options: {
    requireWeakSignal?: boolean;
  } = {}
): void => {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    if (seen.has(element)) {
      continue;
    }

    seen.add(element);

    if (options.requireWeakSignal && !hasWeakHintSignal(element)) {
      continue;
    }

    if (isEligibleHintTarget(element, mode, visibility)) {
      target.push(element);
    }
  }
};

export const getHintableElements = (mode: LinkMode): HTMLElement[] => {
  const visibility = createHintVisibilityContext();
  const { getRect, getIdentity, getDepth, getPreference } = createHintCollectionContext({
    getRect: visibility.getRect
  });
  const elements: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  if (mode === "copy-link" || mode === "new-tab" || mode === "copy-image") {
    appendEligibleElements(elements, getHintSelector(mode), mode, seen, visibility);
  } else {
    appendEligibleElements(elements, HINT_SELECTORS_DEFAULT_STRONG, mode, seen, visibility);
    appendEligibleElements(elements, HINT_SELECTORS_DEFAULT_WEAK, mode, seen, visibility, {
      requireWeakSignal: true
    });
  }

  const uniqueElements = dedupeCollectedHintTargets(elements, {
    getRect,
    getIdentity,
    getDepth,
    getPreference
  });

  return uniqueElements
    .map((element) => ({
      depth: getDepth(element),
      element,
      rect: getRect(element)
    }))
    .sort((left, right) => {
      if (!left.rect || !right.rect) {
        return 0;
      }

      if (left.rect.top !== right.rect.top) {
        return left.rect.top - right.rect.top;
      }

      if (left.rect.left !== right.rect.left) {
        return left.rect.left - right.rect.left;
      }

      return left.depth - right.depth;
    })
    .map(({ element }) => element);
};