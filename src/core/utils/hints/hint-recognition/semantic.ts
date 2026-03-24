import { areRectsEquivalent } from "~/src/core/utils/hints/dom";
import type {
  SpatialIndex,
  GetPreference,
  GetRect
} from "~/src/core/utils/hints/hint-recognition/shared";

const SEMANTIC_DEDUPE_CELL_SIZE = 96;

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
    const bucket = index.get(y)?.get(x);
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

const areEquivalentSemanticTargets = (
  leftElement: HTMLElement,
  rightElement: HTMLElement,
  getRect: GetRect,
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

export const dedupeEquivalentSemanticTargets = (
  elements: HTMLElement[],
  getRect: GetRect,
  getPreference: GetPreference,
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
      return candidate
        ? areEquivalentSemanticTargets(candidate, element, getRect, getSemanticScore)
        : false;
    });

    if (duplicateIndex === undefined) {
      const nextIndex = deduped.length;
      deduped.push(element);
      if (elementRect) {
        addSpatialCandidateIndex(spatialIndex, elementRect, nextIndex);
      }
      continue;
    }

    const existing = deduped[duplicateIndex]!;
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