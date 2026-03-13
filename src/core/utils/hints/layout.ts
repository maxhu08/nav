import {
  getMarkerRect,
  revealElementForHintCollection
} from "~/src/core/utils/hints/hint-recognition";
import type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/hint-recognition";
import {
  invalidateMarkerSize,
  setThumbnailMarkerIconVisibility
} from "~/src/core/utils/hints/markers";
import type { HintMarker, ReservedHintDirective } from "~/src/core/utils/hints/types";

const MARKER_VIEWPORT_PADDING = 4;
const MARKER_COLLISION_GAP = 2;
const MARKER_ANCHOR_INSET = 2;
const MARKER_COLLISION_CELL_SIZE = 80;
const MARKER_SEARCH_STEP = 24;
const MARKER_SEARCH_RINGS = 6;
const MIN_THUMBNAIL_WIDTH = 96;
const MIN_THUMBNAIL_HEIGHT = 54;
const MIN_THUMBNAIL_MEDIA_AREA_RATIO = 0.45;
const MIN_THUMBNAIL_RECTANGULAR_RATIO = 1.15;
const MIN_COPY_IMAGE_THUMBNAIL_WIDTH = 180;
const MIN_COPY_IMAGE_THUMBNAIL_HEIGHT = 120;

type PlacedMarkerRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type RectLike = Pick<DOMRect, "left" | "top" | "right" | "bottom" | "width" | "height">;
type MarkerVariant = "default" | "thumbnail";
type CollisionGrid = Map<number, Map<number, PlacedMarkerRect[]>>;

const DIRECTIVE_LAYOUT_PRIORITIES: Partial<Record<ReservedHintDirective, number>> = {
  attach: 100,
  input: 90,
  submit: 80,
  cancel: 70,
  next: 60,
  prev: 60,
  home: 50,
  sidebar: 40,
  like: 30,
  dislike: 30
};

const getMarkerLayoutPriority = (hint: Pick<HintMarker, "directive">): number =>
  hint.directive ? (DIRECTIVE_LAYOUT_PRIORITIES[hint.directive] ?? 10) : 0;

const doPlacedMarkerRectsOverlap = (left: PlacedMarkerRect, right: PlacedMarkerRect): boolean =>
  left.left < right.right + MARKER_COLLISION_GAP &&
  left.right > right.left - MARKER_COLLISION_GAP &&
  left.top < right.bottom + MARKER_COLLISION_GAP &&
  left.bottom > right.top - MARKER_COLLISION_GAP;

const clampMarkerPosition = (
  left: number,
  top: number,
  width: number,
  height: number
): Pick<PlacedMarkerRect, "left" | "top"> => ({
  left: Math.min(
    Math.max(MARKER_VIEWPORT_PADDING, left),
    Math.max(MARKER_VIEWPORT_PADDING, window.innerWidth - width - MARKER_VIEWPORT_PADDING)
  ),
  top: Math.min(
    Math.max(MARKER_VIEWPORT_PADDING, top),
    Math.max(MARKER_VIEWPORT_PADDING, window.innerHeight - height - MARKER_VIEWPORT_PADDING)
  )
});

const createPlacedMarkerRect = (
  left: number,
  top: number,
  width: number,
  height: number
): PlacedMarkerRect => ({
  left,
  top,
  right: left + width,
  bottom: top + height
});

const getRectArea = (rect: Pick<DOMRect, "width" | "height">): number =>
  Math.max(0, rect.width) * Math.max(0, rect.height);

const getRectangularRatio = (rect: Pick<DOMRect, "width" | "height">): number => {
  const shortestSide = Math.min(rect.width, rect.height);
  const longestSide = Math.max(rect.width, rect.height);

  if (shortestSide <= 0) {
    return 0;
  }

  return longestSide / shortestSide;
};

const hasThumbnailKeyword = (value: string | null | undefined): boolean =>
  !!value && /(thumbnail|thumb|poster|preview|cover)/i.test(value);

const hasNonThumbnailMediaKeyword = (value: string | null | undefined): boolean =>
  !!value && /(logo|icon|avatar|badge|brand|wordmark)/i.test(value);

const THUMBNAIL_SELECTOR = [
  "img",
  "picture",
  "video",
  "canvas",
  "[role='img']",
  "[data-thumbnail]",
  "[id*='thumbnail']",
  "[class*='thumbnail']",
  "[data-testid*='thumbnail']"
].join(", ");

const hasExplicitThumbnailSignal = (element: HTMLElement): boolean =>
  hasThumbnailKeyword(element.id) ||
  hasThumbnailKeyword(element.className) ||
  hasThumbnailKeyword(element.tagName) ||
  hasThumbnailKeyword(element.getAttribute("data-testid")) ||
  hasThumbnailKeyword(element.getAttribute("data-e2e")) ||
  hasThumbnailKeyword(element.getAttribute("data-thumbnail")) ||
  hasThumbnailKeyword(element.getAttribute("aria-label")) ||
  hasThumbnailKeyword(element.getAttribute("title"));

const hasNonThumbnailMediaSignal = (element: HTMLElement): boolean =>
  hasNonThumbnailMediaKeyword(element.id) ||
  hasNonThumbnailMediaKeyword(element.className) ||
  hasNonThumbnailMediaKeyword(element.tagName) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("data-testid")) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("data-e2e")) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("aria-label")) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("title"));

const isImplicitThumbnailElement = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();

  return (
    tagName === "img" ||
    tagName === "picture" ||
    tagName === "video" ||
    tagName === "canvas" ||
    element.getAttribute("role")?.toLowerCase() === "img"
  );
};

const collectUniqueThumbnailElements = (element: HTMLElement): HTMLElement[] => {
  const seen = new Set<HTMLElement>();
  seen.add(element);

  for (const candidate of Array.from(element.querySelectorAll<HTMLElement>(THUMBNAIL_SELECTOR))) {
    seen.add(candidate);
  }

  return Array.from(seen);
};

const getPreferredThumbnailRect = (
  targetRect: DOMRect,
  thumbnailElements: readonly HTMLElement[]
): DOMRect | null => {
  const targetArea = getRectArea(targetRect);

  if (targetArea === 0) {
    return null;
  }

  let bestRect: DOMRect | null = null;
  let bestArea = 0;

  for (const thumbnailElement of thumbnailElements) {
    const rect = getMarkerRect(thumbnailElement);
    if (!rect) continue;
    if (rect.width < MIN_THUMBNAIL_WIDTH || rect.height < MIN_THUMBNAIL_HEIGHT) continue;

    const area = getRectArea(rect);
    if (area / targetArea < MIN_THUMBNAIL_MEDIA_AREA_RATIO) continue;
    if (area <= bestArea) continue;

    bestArea = area;
    bestRect = rect;
  }

  return bestRect;
};

const isThumbnailLikeTarget = (
  targetRect: DOMRect,
  thumbnailElements: readonly HTMLElement[],
  preferredThumbnailRect: DOMRect | null
): boolean => {
  if (targetRect.width < MIN_THUMBNAIL_WIDTH || targetRect.height < MIN_THUMBNAIL_HEIGHT) {
    return false;
  }

  if (!preferredThumbnailRect) {
    return false;
  }

  const hasExplicitSignal = thumbnailElements.some((mediaElement) =>
    hasExplicitThumbnailSignal(mediaElement)
  );

  if (hasExplicitSignal) {
    return true;
  }

  if (thumbnailElements.some((mediaElement) => hasNonThumbnailMediaSignal(mediaElement))) {
    return false;
  }

  if (!thumbnailElements.some((mediaElement) => isImplicitThumbnailElement(mediaElement))) {
    return false;
  }

  return getRectangularRatio(preferredThumbnailRect) >= MIN_THUMBNAIL_RECTANGULAR_RATIO;
};

type MarkerPlacementInfo = {
  variant: MarkerVariant;
  anchorRect: DOMRect;
};

const getMarkerPlacementInfo = (
  element: HTMLElement,
  targetRect: DOMRect,
  mode: LinkMode,
  highlightThumbnails: boolean
): MarkerPlacementInfo => {
  if (!highlightThumbnails) {
    return { variant: "default", anchorRect: targetRect };
  }

  const thumbnailElements = collectUniqueThumbnailElements(element);
  const preferredThumbnailRect = getPreferredThumbnailRect(targetRect, thumbnailElements);

  if (mode === "copy-image" && element instanceof HTMLImageElement) {
    const useThumbnail =
      targetRect.width >= MIN_COPY_IMAGE_THUMBNAIL_WIDTH &&
      targetRect.height >= MIN_COPY_IMAGE_THUMBNAIL_HEIGHT;
    return {
      variant: useThumbnail ? "thumbnail" : "default",
      anchorRect: useThumbnail ? (preferredThumbnailRect ?? targetRect) : targetRect
    };
  }

  const useThumbnail = isThumbnailLikeTarget(targetRect, thumbnailElements, preferredThumbnailRect);
  return {
    variant: useThumbnail ? "thumbnail" : "default",
    anchorRect: useThumbnail ? (preferredThumbnailRect ?? targetRect) : targetRect
  };
};

const getMarkerPositionCandidates = (
  anchorRect: RectLike,
  shouldHighlightThumbnail: boolean,
  markerWidth: number,
  markerHeight: number
): Array<Pick<PlacedMarkerRect, "left" | "top">> => {
  const candidates: Array<Pick<PlacedMarkerRect, "left" | "top">> = [];
  const seen = new Set<string>();

  const pushCandidate = (left: number, top: number): void => {
    const clamped = clampMarkerPosition(left, top, markerWidth, markerHeight);
    const key = `${Math.round(clamped.left)}:${Math.round(clamped.top)}`;

    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(clamped);
  };

  const left = anchorRect.left + MARKER_ANCHOR_INSET;
  const top = anchorRect.top + MARKER_ANCHOR_INSET;
  const right = Math.max(anchorRect.left, anchorRect.right - markerWidth - MARKER_ANCHOR_INSET);
  const bottom = Math.max(anchorRect.top, anchorRect.bottom - markerHeight - MARKER_ANCHOR_INSET);
  const centerLeft = anchorRect.left + (anchorRect.width - markerWidth) / 2;
  const centerTop = anchorRect.top + (anchorRect.height - markerHeight) / 2;

  if (shouldHighlightThumbnail) {
    pushCandidate(centerLeft, centerTop);
    pushCandidate(centerLeft, top);
    pushCandidate(left, centerTop);
  }

  pushCandidate(left, top);
  pushCandidate(right, top);
  pushCandidate(left, bottom);
  pushCandidate(right, bottom);
  pushCandidate(centerLeft, top);
  pushCandidate(left, centerTop);

  if (!shouldHighlightThumbnail) {
    pushCandidate(centerLeft, centerTop);
  }

  for (let ring = 1; ring <= MARKER_SEARCH_RINGS; ring += 1) {
    const offset = ring * MARKER_SEARCH_STEP;
    const aboveTop = anchorRect.top - markerHeight - offset;
    const belowTop = anchorRect.bottom + offset;
    const leftOutside = anchorRect.left - markerWidth - offset;
    const rightOutside = anchorRect.right + offset;

    pushCandidate(centerLeft, aboveTop);
    pushCandidate(centerLeft, belowTop);
    pushCandidate(leftOutside, centerTop);
    pushCandidate(rightOutside, centerTop);

    pushCandidate(leftOutside, aboveTop);
    pushCandidate(rightOutside, aboveTop);
    pushCandidate(leftOutside, belowTop);
    pushCandidate(rightOutside, belowTop);

    pushCandidate(left - offset, top);
    pushCandidate(right + offset, top);
    pushCandidate(left, top - offset);
    pushCandidate(left, bottom + offset);
  }

  return candidates;
};

const getMarkerPlacementCandidates = (
  anchorRect: DOMRect,
  markerVariant: MarkerVariant,
  markerWidth: number,
  markerHeight: number
): Array<Pick<PlacedMarkerRect, "left" | "top">> => {
  return getMarkerPositionCandidates(
    anchorRect,
    markerVariant === "thumbnail",
    markerWidth,
    markerHeight
  );
};

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

const hasCollision = (collisionGrid: CollisionGrid, nextRect: PlacedMarkerRect): boolean => {
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

const addToCollisionGrid = (collisionGrid: CollisionGrid, rect: PlacedMarkerRect): void => {
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

export const updateMarkerPositions = (
  markers: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
): void => {
  const collisionGrid: CollisionGrid = new Map();
  const markersByPlacementPriority = [...markers].sort(
    (left, right) => getMarkerLayoutPriority(right) - getMarkerLayoutPriority(left)
  );

  for (const hint of markersByPlacementPriority) {
    const targetRect = getMarkerRect(hint.element);

    if (!targetRect) {
      if (hint.marker.style.display !== "none") {
        hint.marker.style.display = "none";
      }
      continue;
    }

    if (hint.marker.style.display === "none") {
      hint.marker.style.display = "";
    }

    const { variant: markerVariant, anchorRect } = getMarkerPlacementInfo(
      hint.element,
      targetRect,
      mode,
      highlightThumbnails
    );

    const didChangeThumbnailIconVisibility = setThumbnailMarkerIconVisibility(
      hint,
      markerVariant === "thumbnail"
    );

    if (hint.marker.getAttribute(markerVariantStyleAttribute) !== markerVariant) {
      hint.marker.setAttribute(markerVariantStyleAttribute, markerVariant);
      invalidateMarkerSize(hint);
    } else if (didChangeThumbnailIconVisibility) {
      invalidateMarkerSize(hint);
    }

    if (hint.sizeDirty || hint.markerWidth <= 0 || hint.markerHeight <= 0) {
      const markerRect = hint.marker.getBoundingClientRect();
      hint.markerWidth = Math.max(1, Math.round(markerRect.width));
      hint.markerHeight = Math.max(1, Math.round(markerRect.height));
      hint.sizeDirty = false;
    }

    const markerWidth = hint.markerWidth;
    const markerHeight = hint.markerHeight;
    hint.marker.style.zIndex = `${1000 + getMarkerLayoutPriority(hint)}`;
    const candidates = getMarkerPlacementCandidates(
      anchorRect,
      markerVariant,
      markerWidth,
      markerHeight
    );

    let chosenRect: PlacedMarkerRect | null = null;

    for (const candidate of candidates) {
      const nextRect = createPlacedMarkerRect(
        candidate.left,
        candidate.top,
        markerWidth,
        markerHeight
      );

      if (!hasCollision(collisionGrid, nextRect)) {
        chosenRect = nextRect;
        break;
      }
    }

    if (!chosenRect) {
      hint.marker.style.display = "none";
      continue;
    }

    hint.marker.style.left = `${Math.round(chosenRect.left)}px`;
    hint.marker.style.top = `${Math.round(chosenRect.top)}px`;
    addToCollisionGrid(collisionGrid, chosenRect);
  }
};

const getVideoHintContainer = (element: HTMLElement): HTMLElement | null => {
  if (element instanceof HTMLVideoElement) {
    return element;
  }

  let current: HTMLElement | null = element;

  while (current) {
    if (current.querySelector("video")) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

export const revealVideoHintControls = (
  markers: HintMarker[],
  revealedElements: RevealedHintElement[]
): void => {
  const seen = new Set<HTMLElement>();

  for (const { element } of markers) {
    const videoContainer = getVideoHintContainer(element);
    if (!videoContainer) continue;

    let current: HTMLElement | null = element;

    while (current) {
      if (!seen.has(current)) {
        revealElementForHintCollection(current, seen, revealedElements);
      }

      if (current === videoContainer) {
        break;
      }

      current = current.parentElement;
    }
  }
};