import {
  areRectsEquivalent,
  isActivatableElement,
  getDomDepth,
  getElementTabIndex,
  getHintTargetPreference,
  getMarkerRect,
  isHintable,
  isVisibleHintTarget
} from "~/src/core/utils/hints/dom";
import { getAttachCandidateScore } from "~/src/core/utils/hints/directive-recognition";
import type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/model";

export type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/model";
export { getMarkerRect } from "~/src/core/utils/hints/dom";
export {
  getAttachEquivalentIndexes,
  getPreferredAttachElementIndex,
  getPreferredCancelElementIndex,
  getPreferredDirectiveIndexes,
  getPreferredDislikeElementIndex,
  getPreferredHomeElementIndex,
  getPreferredInputElementIndex,
  getPreferredLikeElementIndex,
  getPreferredNextElementIndex,
  getPreferredPrevElementIndex,
  getPreferredSearchElementIndex,
  getPreferredSidebarElementIndex,
  getPreferredSubmitElementIndex,
  getStronglyOverlappingHintIndexes,
  getSuppressedAttachRelatedHintIndexes
} from "~/src/core/utils/hints/directive-recognition";

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

type HintCollectionContext = {
  getRect: (element: HTMLElement) => DOMRect | null;
  getIdentity: (element: HTMLElement) => string | null;
  getDepth: (element: HTMLElement) => number;
  getPreference: (element: HTMLElement) => number;
};

const getHintIdentity = (element: HTMLElement): string | null => {
  if (
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
    element.href
  ) {
    return `href:${element.href}`;
  }

  const rawHref = element.getAttribute("href");
  if (rawHref) {
    return `href:${rawHref}`;
  }

  if (element instanceof HTMLLabelElement && element.control) {
    const controlId = element.control.id || element.control.getAttribute("name") || "";
    return `label:${element.control.tagName}:${controlId}`;
  }

  const ariaLabel = element.getAttribute("aria-label")?.trim();
  if (ariaLabel) {
    return `label:${ariaLabel}`;
  }

  const title = element.getAttribute("title")?.trim();
  if (title) {
    return `title:${title}`;
  }

  const text = element.textContent?.replace(/\s+/g, " ").trim();
  if (text) {
    return `text:${text}`;
  }

  return null;
};

const getApproximateRectKey = (rect: DOMRect): string => {
  const round = (value: number): number => Math.round(value * 2) / 2;
  return `${round(rect.top)}:${round(rect.left)}:${round(rect.width)}:${round(rect.height)}`;
};

const getEquivalentTargetBucketKey = (
  element: HTMLElement,
  rect: DOMRect | null,
  identity: string | null
): string => {
  const role = element.getAttribute("role")?.toLowerCase() ?? "";
  const rectKey = rect ? getApproximateRectKey(rect) : "no-rect";
  return `${rectKey}|${identity ?? ""}|${role}|${element.tagName}`;
};

const areEquivalentHintTargets = (
  leftElement: HTMLElement,
  rightElement: HTMLElement,
  getRect: (element: HTMLElement) => DOMRect | null,
  getIdentity: (element: HTMLElement) => string | null
): boolean => {
  if (!leftElement.contains(rightElement) && !rightElement.contains(leftElement)) {
    return false;
  }

  const leftRect = getRect(leftElement);
  const rightRect = getRect(rightElement);
  if (!leftRect || !rightRect || !areRectsEquivalent(leftRect, rightRect)) {
    return false;
  }

  const leftIdentity = getIdentity(leftElement);
  const rightIdentity = getIdentity(rightElement);

  if (leftIdentity && rightIdentity) {
    return leftIdentity === rightIdentity;
  }

  const leftRole = leftElement.getAttribute("role")?.toLowerCase() ?? null;
  const rightRole = rightElement.getAttribute("role")?.toLowerCase() ?? null;

  if (leftRole || rightRole) {
    return leftRole === rightRole;
  }

  return leftElement.tagName === rightElement.tagName;
};

const dedupeHintTargets = (
  elements: HTMLElement[],
  getRect: (element: HTMLElement) => DOMRect | null,
  getIdentity: (element: HTMLElement) => string | null,
  getPreference: (element: HTMLElement) => number
): HTMLElement[] => {
  const bucketMap = new Map<string, HTMLElement[]>();

  for (const element of elements) {
    const bucketKey = getEquivalentTargetBucketKey(element, getRect(element), getIdentity(element));
    const bucket = bucketMap.get(bucketKey);

    if (bucket) {
      bucket.push(element);
      continue;
    }

    bucketMap.set(bucketKey, [element]);
  }

  const deduped: HTMLElement[] = [];

  for (const bucket of bucketMap.values()) {
    const representatives: HTMLElement[] = [];

    for (const element of bucket) {
      const duplicateIndex = representatives.findIndex((candidate) =>
        areEquivalentHintTargets(candidate, element, getRect, getIdentity)
      );

      if (duplicateIndex === -1) {
        representatives.push(element);
        continue;
      }

      const existing = representatives[duplicateIndex];
      if (existing && getPreference(element) > getPreference(existing)) {
        representatives[duplicateIndex] = element;
      }
    }

    deduped.push(...representatives);
  }

  return deduped;
};

const getAssociatedFileInput = (element: HTMLElement): HTMLInputElement | null => {
  if (element instanceof HTMLInputElement && element.type.toLowerCase() === "file") {
    return element;
  }

  if (
    element instanceof HTMLLabelElement &&
    element.control instanceof HTMLInputElement &&
    element.control.type.toLowerCase() === "file"
  ) {
    return element.control;
  }

  const ancestorLabel = element.closest("label");
  if (
    ancestorLabel instanceof HTMLLabelElement &&
    ancestorLabel.control instanceof HTMLInputElement &&
    ancestorLabel.control.type.toLowerCase() === "file"
  ) {
    return ancestorLabel.control;
  }

  return null;
};

const dedupeEquivalentAttachTargets = (
  elements: HTMLElement[],
  getRect: (element: HTMLElement) => DOMRect | null,
  getPreference: (element: HTMLElement) => number
): HTMLElement[] => {
  const attachRepresentatives = new Map<HTMLInputElement, HTMLElement>();

  for (const element of elements) {
    const control = getAssociatedFileInput(element);
    if (!control) {
      continue;
    }

    const existing = attachRepresentatives.get(control);
    if (!existing) {
      attachRepresentatives.set(control, element);
      continue;
    }

    const elementScore = getAttachCandidateScore(element, getRect(element));
    const existingScore = getAttachCandidateScore(existing, getRect(existing));

    if (
      elementScore > existingScore ||
      (elementScore === existingScore && getPreference(element) > getPreference(existing))
    ) {
      attachRepresentatives.set(control, element);
    }
  }

  return elements.filter((element) => {
    const control = getAssociatedFileInput(element);
    if (!control) {
      return true;
    }

    return attachRepresentatives.get(control) === element;
  });
};

const areEquivalentSemanticTargets = (
  leftElement: HTMLElement,
  rightElement: HTMLElement,
  getRect: (element: HTMLElement) => DOMRect | null,
  getSemanticScore: (element: HTMLElement, rectOverride?: DOMRect | null) => number
): boolean => {
  const leftRect = getRect(leftElement);
  const rightRect = getRect(rightElement);
  if (!leftRect || !rightRect) {
    return false;
  }

  const intersectionWidth = Math.max(
    0,
    Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left)
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top)
  );
  const intersectionArea = intersectionWidth * intersectionHeight;
  const smallerArea = Math.max(
    1,
    Math.min(leftRect.width * leftRect.height, rightRect.width * rightRect.height)
  );

  if (!areRectsEquivalent(leftRect, rightRect) && intersectionArea / smallerArea < 0.75) {
    return false;
  }

  return (
    getSemanticScore(leftElement, leftRect) !== Number.NEGATIVE_INFINITY &&
    getSemanticScore(rightElement, rightRect) !== Number.NEGATIVE_INFINITY
  );
};

const dedupeEquivalentSemanticTargets = (
  elements: HTMLElement[],
  getRect: (element: HTMLElement) => DOMRect | null,
  getPreference: (element: HTMLElement) => number,
  getSemanticScore: (element: HTMLElement, rectOverride?: DOMRect | null) => number
): HTMLElement[] => {
  const deduped: HTMLElement[] = [];

  for (const element of elements) {
    const duplicateIndex = deduped.findIndex((candidate) =>
      areEquivalentSemanticTargets(candidate, element, getRect, getSemanticScore)
    );

    if (duplicateIndex === -1) {
      deduped.push(element);
      continue;
    }

    const existing = deduped[duplicateIndex];
    if (!existing) {
      deduped.push(element);
      continue;
    }

    const elementRect = getRect(element);
    const existingRect = getRect(existing);
    const elementScore = getSemanticScore(element, elementRect);
    const existingScore = getSemanticScore(existing, existingRect);

    if (
      elementScore > existingScore ||
      (elementScore === existingScore && getPreference(element) > getPreference(existing))
    ) {
      deduped[duplicateIndex] = element;
    }
  }

  return deduped;
};

const hasEquivalentAncestorTarget = (
  element: HTMLElement,
  candidates: ReadonlySet<HTMLElement>,
  getRect: (element: HTMLElement) => DOMRect | null
): boolean => {
  if (!(element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement)) {
    return false;
  }

  const resolvedHref = element.href;
  if (!resolvedHref) {
    return false;
  }

  const elementRect = getRect(element);
  if (!elementRect) {
    return false;
  }

  let current = element.parentElement;

  while (current) {
    if (
      candidates.has(current) &&
      current.contains(element) &&
      (current.getAttribute("role")?.toLowerCase() === "link" ||
        getElementTabIndex(current) !== null)
    ) {
      const currentRect = getRect(current);
      const currentHref = current.getAttribute("href");

      if (
        currentRect &&
        areRectsEquivalent(currentRect, elementRect) &&
        (!currentHref || currentHref === resolvedHref)
      ) {
        return true;
      }
    }

    current = current.parentElement;
  }

  return false;
};

const getHintSelector = (mode: LinkMode): string => {
  if (mode === "copy-link" || mode === "new-tab") {
    return HINT_SELECTORS_COPY_LINK;
  }

  if (mode === "copy-image") {
    return HINT_SELECTORS_COPY_IMAGE;
  }

  return HINT_SELECTORS_DEFAULT;
};

const createHintCollectionContext = (): HintCollectionContext => {
  const rectCache = new WeakMap<HTMLElement, DOMRect | null>();
  const identityCache = new WeakMap<HTMLElement, string | null>();
  const depthCache = new WeakMap<HTMLElement, number>();
  const preferenceCache = new WeakMap<HTMLElement, number>();

  const getRect = (element: HTMLElement): DOMRect | null => {
    if (rectCache.has(element)) {
      return rectCache.get(element) ?? null;
    }

    const rect = getMarkerRect(element);
    rectCache.set(element, rect);
    return rect;
  };

  const getIdentity = (element: HTMLElement): string | null => {
    if (identityCache.has(element)) {
      return identityCache.get(element) ?? null;
    }

    const identity = getHintIdentity(element);
    identityCache.set(element, identity);
    return identity;
  };

  const getDepth = (element: HTMLElement): number => {
    const cachedDepth = depthCache.get(element);
    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    const depth = getDomDepth(element);
    depthCache.set(element, depth);
    return depth;
  };

  const getPreference = (element: HTMLElement): number => {
    const cachedPreference = preferenceCache.get(element);
    if (cachedPreference !== undefined) {
      return cachedPreference;
    }

    const preference = getHintTargetPreference(element);
    preferenceCache.set(element, preference);
    return preference;
  };

  return {
    getRect,
    getIdentity,
    getDepth,
    getPreference
  };
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

  const candidateSet = new Set(elements);
  const withoutEquivalentAncestors = elements.filter(
    (element) => !hasEquivalentAncestorTarget(element, candidateSet, getRect)
  );
  const uniqueElements = dedupeEquivalentAttachTargets(
    dedupeEquivalentSemanticTargets(
      dedupeHintTargets(withoutEquivalentAncestors, getRect, getIdentity, getPreference),
      getRect,
      getPreference,
      getAttachCandidateScore
    ),
    getRect,
    getPreference
  );

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