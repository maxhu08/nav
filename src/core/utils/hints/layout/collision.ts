import {
  MARKER_COLLISION_CELL_SIZE,
  MARKER_COLLISION_GAP,
  createPlacedMarkerRect,
  type CollisionGrid,
  type MarkerVisibilityScore,
  type PlacedMarkerRect
} from "~/src/core/utils/hints/layout/shared";

const doPlacedMarkerRectsOverlap = (left: PlacedMarkerRect, right: PlacedMarkerRect): boolean =>
  left.left < right.right + MARKER_COLLISION_GAP &&
  left.right > right.left - MARKER_COLLISION_GAP &&
  left.top < right.bottom + MARKER_COLLISION_GAP &&
  left.bottom > right.top - MARKER_COLLISION_GAP;

const forEachCollisionBucket = (
  rect: PlacedMarkerRect,
  callback: (x: number, y: number) => void
): void => {
  const minX = Math.floor((rect.left - MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const maxX = Math.floor((rect.right + MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const minY = Math.floor((rect.top - MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const maxY = Math.floor((rect.bottom + MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      callback(x, y);
    }
  }
};

export const hasCollision = (collisionGrid: CollisionGrid, nextRect: PlacedMarkerRect): boolean => {
  let collides = false;

  forEachCollisionBucket(nextRect, (x, y) => {
    if (collides) return;
    const row = collisionGrid.get(y);
    if (!row) return;
    const bucket = row.get(x);
    if (!bucket) return;

    for (const placedRect of bucket) {
      if (doPlacedMarkerRectsOverlap(placedRect, nextRect)) {
        collides = true;
        return;
      }
    }
  });

  return collides;
};

export const addToCollisionGrid = (collisionGrid: CollisionGrid, rect: PlacedMarkerRect): void => {
  forEachCollisionBucket(rect, (x, y) => {
    const row = collisionGrid.get(y);
    const bucket = row?.get(x);

    if (bucket) {
      bucket.push(rect);
      return;
    }

    if (row) {
      row.set(x, [rect]);
      return;
    }

    collisionGrid.set(y, new Map([[x, [rect]]]));
  });
};

const isComposedDescendant = (ancestor: Element, node: Element): boolean => {
  let current: Node | null = node;

  while (current) {
    if (current === ancestor) {
      return true;
    }

    if (current instanceof ShadowRoot) {
      current = current.host;
      continue;
    }

    current = current.parentNode;
  }

  return false;
};

const getElementsAtPoint = (x: number, y: number): Element[] => {
  try {
    return typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(x, y) : [];
  } catch {
    return [];
  }
};

const POPUP_OCCLUDER_SELECTOR = [
  "dialog",
  "[role='dialog']",
  "[aria-modal='true']",
  "[id*='modal' i]",
  "[class*='modal' i]",
  "[id*='popup' i]",
  "[class*='popup' i]"
].join(",");

const isPotentialOccludingElement = (element: Element): element is HTMLElement => {
  if (element instanceof HTMLElement && element.closest("[data-nav-hint-marker]")) {
    return false;
  }

  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse" ||
    style.pointerEvents === "none" ||
    Number.parseFloat(style.opacity) === 0
  ) {
    return false;
  }

  return (
    style.position === "fixed" ||
    style.position === "sticky" ||
    element.matches(POPUP_OCCLUDER_SELECTOR)
  );
};

const isPointOccludedForMarker = (target: HTMLElement, x: number, y: number): boolean => {
  for (const element of getElementsAtPoint(x, y)) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    if (isComposedDescendant(target, element) || isComposedDescendant(element, target)) {
      return false;
    }

    if (isPotentialOccludingElement(element)) {
      return true;
    }
  }

  return false;
};

const getMarkerVisibilityScore = (
  target: HTMLElement,
  rect: PlacedMarkerRect
): MarkerVisibilityScore => {
  const points: Array<[number, number]> = [
    [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2],
    [rect.left + 1, rect.top + 1],
    [(rect.left + rect.right) / 2, rect.top + 1],
    [rect.right - 1, rect.top + 1],
    [rect.left + 1, (rect.top + rect.bottom) / 2],
    [rect.right - 1, (rect.top + rect.bottom) / 2],
    [rect.left + 1, rect.bottom - 1],
    [(rect.left + rect.right) / 2, rect.bottom - 1],
    [rect.right - 1, rect.bottom - 1]
  ];
  const score: MarkerVisibilityScore = {
    clearPoints: 0,
    occludedPoints: 0
  };

  for (const [x, y] of points) {
    if (isPointOccludedForMarker(target, x, y)) {
      score.occludedPoints += 1;
      continue;
    }

    score.clearPoints += 1;
  }

  return score;
};

const isBetterMarkerVisibilityScore = (
  candidate: MarkerVisibilityScore,
  best: MarkerVisibilityScore | null
): boolean => {
  if (!best) {
    return true;
  }

  if (candidate.occludedPoints !== best.occludedPoints) {
    return candidate.occludedPoints < best.occludedPoints;
  }

  if (candidate.clearPoints !== best.clearPoints) {
    return candidate.clearPoints > best.clearPoints;
  }

  return false;
};

export const chooseMarkerRect = (
  target: HTMLElement,
  _markerVariant: "default" | "thumbnail",
  candidates: Array<Pick<PlacedMarkerRect, "left" | "top">>,
  markerWidth: number,
  markerHeight: number,
  collisionGrid: CollisionGrid
): PlacedMarkerRect | null => {
  let chosenRect: PlacedMarkerRect | null = null;
  let bestVisibilityScore: MarkerVisibilityScore | null = null;

  for (const candidate of candidates) {
    const nextRect = createPlacedMarkerRect(
      candidate.left,
      candidate.top,
      markerWidth,
      markerHeight
    );

    if (hasCollision(collisionGrid, nextRect)) {
      continue;
    }

    const visibilityScore = getMarkerVisibilityScore(target, nextRect);
    if (isBetterMarkerVisibilityScore(visibilityScore, bestVisibilityScore)) {
      chosenRect = nextRect;
      bestVisibilityScore = visibilityScore;

      if (visibilityScore.occludedPoints === 0) {
        break;
      }
    }
  }

  if (!chosenRect || !bestVisibilityScore || bestVisibilityScore.occludedPoints > 0) {
    return null;
  }

  return chosenRect;
};