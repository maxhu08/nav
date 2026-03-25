import {
  createHintVisibilityContext,
  getElementTabIndex,
  hasInteractiveRole
} from "~/src/core/utils/hints/dom";
import {
  getCopyCandidateScore,
  getHideCandidateScore
} from "~/src/core/utils/hints/directive-recognition/action-directives";
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
const HINT_SELECTORS_HIDE_CANDIDATES = [
  "dialog",
  "[role='dialog']",
  "[aria-modal='true']",
  "[id*='modal' i]",
  "[class*='modal' i]",
  "[id*='popup' i]",
  "[class*='popup' i]",
  "[id*='overlay' i]",
  "[class*='overlay' i]",
  "[id*='backdrop' i]",
  "[class*='backdrop' i]",
  "[id*='scrim' i]",
  "[class*='scrim' i]",
  "[id*='lightbox' i]",
  "[class*='lightbox' i]"
].join(",");
const HINT_SELECTORS_COPY_CANDIDATES = [
  "button",
  "a",
  "[role='button']",
  "[onclick]",
  "[jsaction]",
  "[title*='copy' i]",
  "[title*='duplicate' i]",
  "[aria-label*='copy' i]",
  "[aria-label*='duplicate' i]",
  "[data-testid*='copy' i]",
  "[data-testid*='duplicate' i]",
  "[data-test-id*='copy' i]",
  "[data-test-id*='duplicate' i]",
  "[class*='copy' i]",
  "[id*='copy' i]",
  "[name*='copy' i]"
].join(",");

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

const getHintSearchRoots = (): Array<Document | ShadowRoot> => {
  const roots: Array<Document | ShadowRoot> = [];
  const visitedRoots = new Set<Document | ShadowRoot>();

  const visitRoot = (root: Document | ShadowRoot): void => {
    if (visitedRoots.has(root)) {
      return;
    }

    visitedRoots.add(root);
    roots.push(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node: Node | null = walker.nextNode();

    while (node) {
      if (node instanceof HTMLElement && node.shadowRoot) {
        visitRoot(node.shadowRoot);
      }

      node = walker.nextNode();
    }
  };

  visitRoot(document);

  return roots;
};

const appendEligibleElements = (
  target: HTMLElement[],
  roots: ReadonlyArray<Document | ShadowRoot>,
  selector: string,
  mode: LinkMode,
  seen: Set<HTMLElement>,
  visibility: ReturnType<typeof createHintVisibilityContext>,
  options: {
    requireWeakSignal?: boolean;
  } = {}
): void => {
  for (const root of roots) {
    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
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
  }
};

const appendLikelyHideElements = (
  target: HTMLElement[],
  roots: ReadonlyArray<Document | ShadowRoot>,
  seen: Set<HTMLElement>,
  visibility: ReturnType<typeof createHintVisibilityContext>
): void => {
  appendScoredElements(
    target,
    roots,
    HINT_SELECTORS_HIDE_CANDIDATES,
    seen,
    visibility,
    getHideCandidateScore,
    240
  );
};

const appendLikelyCopyElements = (
  target: HTMLElement[],
  roots: ReadonlyArray<Document | ShadowRoot>,
  seen: Set<HTMLElement>,
  visibility: ReturnType<typeof createHintVisibilityContext>
): void => {
  appendScoredElements(
    target,
    roots,
    HINT_SELECTORS_COPY_CANDIDATES,
    seen,
    visibility,
    getCopyCandidateScore,
    220
  );
};

const appendScoredElements = (
  target: HTMLElement[],
  roots: ReadonlyArray<Document | ShadowRoot>,
  selector: string,
  seen: Set<HTMLElement>,
  visibility: ReturnType<typeof createHintVisibilityContext>,
  getScore: (element: HTMLElement) => number,
  minimumScore: number
): void => {
  for (const root of roots) {
    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
      if (seen.has(element) || !visibility.isVisibleHintTarget(element)) {
        continue;
      }

      if (getScore(element) <= minimumScore) {
        continue;
      }

      seen.add(element);
      target.push(element);
    }
  }
};

export const getHintableElements = (mode: LinkMode): HTMLElement[] => {
  const visibility = createHintVisibilityContext();
  const { getRect, getIdentity, getDepth, getPreference } = createHintCollectionContext({
    getRect: visibility.getRect
  });
  const roots = getHintSearchRoots();
  const elements: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  if (mode === "copy-link" || mode === "new-tab" || mode === "copy-image") {
    appendEligibleElements(elements, roots, getHintSelector(mode), mode, seen, visibility);
  } else {
    appendEligibleElements(elements, roots, HINT_SELECTORS_DEFAULT_STRONG, mode, seen, visibility);
    appendEligibleElements(elements, roots, HINT_SELECTORS_DEFAULT_WEAK, mode, seen, visibility, {
      requireWeakSignal: true
    });
    appendLikelyCopyElements(elements, roots, seen, visibility);
    appendLikelyHideElements(elements, roots, seen, visibility);
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