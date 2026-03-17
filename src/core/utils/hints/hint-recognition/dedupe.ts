import {
  areRectsEquivalent,
  getDomDepth,
  getElementTabIndex,
  getHintTargetPreference,
  getMarkerRect
} from "~/src/core/utils/hints/dom";
import { getAttachCandidateScore } from "~/src/core/utils/hints/directive-recognition";

type SpatialIndex = Map<number, Map<number, number[]>>;

export type HintCollectionContext = {
  getRect: (element: HTMLElement) => DOMRect | null;
  getIdentity: (element: HTMLElement) => string | null;
  getDepth: (element: HTMLElement) => number;
  getPreference: (element: HTMLElement) => number;
};

const SEMANTIC_DEDUPE_CELL_SIZE = 96;

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

  const leftRole = leftElement.getAttribute("role")?.toLowerCase() ?? "";
  const rightRole = rightElement.getAttribute("role")?.toLowerCase() ?? "";

  if (leftRole || rightRole) {
    return leftRole === rightRole;
  }

  return leftElement.tagName === rightElement.tagName;
};

const forEachSpatialBucket = (rect: DOMRect, callback: (x: number, y: number) => void): void => {
  const minX = Math.floor(rect.left / SEMANTIC_DEDUPE_CELL_SIZE);
  const maxX = Math.floor(rect.right / SEMANTIC_DEDUPE_CELL_SIZE);
  const minY = Math.floor(rect.top / SEMANTIC_DEDUPE_CELL_SIZE);
  const maxY = Math.floor(rect.bottom / SEMANTIC_DEDUPE_CELL_SIZE);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      callback(x, y);
    }
  }
};

const getSpatialCandidateIndexes = (index: SpatialIndex, rect: DOMRect): number[] => {
  const candidateIndexes = new Set<number>();

  forEachSpatialBucket(rect, (x, y) => {
    const row = index.get(y);
    const bucket = row?.get(x);
    if (!bucket) {
      return;
    }

    for (const candidateIndex of bucket) {
      candidateIndexes.add(candidateIndex);
    }
  });

  return [...candidateIndexes];
};

const addSpatialCandidateIndex = (
  index: SpatialIndex,
  rect: DOMRect,
  candidateIndex: number
): void => {
  forEachSpatialBucket(rect, (x, y) => {
    const row = index.get(y);
    const bucket = row?.get(x);

    if (bucket) {
      bucket.push(candidateIndex);
      return;
    }

    if (row) {
      row.set(x, [candidateIndex]);
      return;
    }

    index.set(y, new Map([[x, [candidateIndex]]]));
  });
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
      if (getPreference(element) > getPreference(existing)) {
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
  const spatialIndex: SpatialIndex = new Map();

  for (const element of elements) {
    const elementRect = getRect(element);
    const candidateIndexes = elementRect
      ? getSpatialCandidateIndexes(spatialIndex, elementRect)
      : [];
    const duplicateIndex = candidateIndexes.find((candidateIndex) => {
      const candidate = deduped[candidateIndex];
      return areEquivalentSemanticTargets(candidate, element, getRect, getSemanticScore);
    });

    if (duplicateIndex === undefined) {
      const nextIndex = deduped.length;
      deduped.push(element);

      if (elementRect) {
        addSpatialCandidateIndex(spatialIndex, elementRect, nextIndex);
      }

      continue;
    }

    const existing = deduped[duplicateIndex];
    const existingRect = getRect(existing);
    const elementScore = getSemanticScore(element, elementRect);
    const existingScore = getSemanticScore(existing, existingRect);

    if (
      elementScore > existingScore ||
      (elementScore === existingScore && getPreference(element) > getPreference(existing))
    ) {
      deduped[duplicateIndex] = element;

      if (elementRect) {
        addSpatialCandidateIndex(spatialIndex, elementRect, duplicateIndex);
      }
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

export const createHintCollectionContext = (): HintCollectionContext => {
  const rectCache = new WeakMap<HTMLElement, DOMRect | null>();
  const identityCache = new WeakMap<HTMLElement, string | null>();
  const depthCache = new WeakMap<HTMLElement, number>();
  const preferenceCache = new WeakMap<HTMLElement, number>();

  const getRect = (element: HTMLElement): DOMRect | null => {
    if (rectCache.has(element)) {
      return rectCache.get(element)!;
    }

    const rect = getMarkerRect(element);
    rectCache.set(element, rect);
    return rect;
  };

  const getIdentity = (element: HTMLElement): string | null => {
    if (identityCache.has(element)) {
      return identityCache.get(element)!;
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

export const dedupeCollectedHintTargets = (
  elements: HTMLElement[],
  context: HintCollectionContext
): HTMLElement[] => {
  const candidateSet = new Set(elements);
  const withoutEquivalentAncestors = elements.filter(
    (element) => !hasEquivalentAncestorTarget(element, candidateSet, context.getRect)
  );

  return dedupeEquivalentAttachTargets(
    dedupeEquivalentSemanticTargets(
      dedupeHintTargets(
        withoutEquivalentAncestors,
        context.getRect,
        context.getIdentity,
        context.getPreference
      ),
      context.getRect,
      context.getPreference,
      getAttachCandidateScore
    ),
    context.getRect,
    context.getPreference
  );
};