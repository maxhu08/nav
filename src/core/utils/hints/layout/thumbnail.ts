import { getMarkerRect } from "~/src/core/utils/hints/hint-recognition";
import { POPUP_DIALOG_SELECTOR } from "~/src/core/utils/hints/directive-recognition/shared";
import type { LinkMode } from "~/src/core/utils/hints/model";
import {
  invalidateMarkerSize,
  setThumbnailMarkerIconVisibility
} from "~/src/core/utils/hints/markers";
import type { HintMarker } from "~/src/core/utils/hints/types";
import {
  MIN_COPY_IMAGE_THUMBNAIL_HEIGHT,
  MIN_COPY_IMAGE_THUMBNAIL_WIDTH,
  MIN_THUMBNAIL_HEIGHT,
  MIN_THUMBNAIL_MEDIA_AREA_RATIO,
  MIN_THUMBNAIL_RECTANGULAR_RATIO,
  MIN_THUMBNAIL_WIDTH,
  type MarkerVariant
} from "~/src/core/utils/hints/layout/shared";

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

  if (isImplicitThumbnailElement(element) || element.hasAttribute("data-thumbnail")) {
    seen.add(element);
  }

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

const COMPOSITE_ROW_SELECTOR = [
  "a[href]",
  "[role='link']",
  "[data-sidebar-item]",
  "[tabindex]:not([tabindex='-1']):not([role='group'])"
].join(", ");

const getCompositeRowAnchorRect = (hint: HintMarker, targetRect: DOMRect): DOMRect | null => {
  if (hint.directive !== null || hint.labelIcon === null) {
    return null;
  }

  if (targetRect.width > 96 || targetRect.height > 64) {
    return null;
  }

  const rowContainer = hint.element.parentElement?.closest(COMPOSITE_ROW_SELECTOR);
  if (!(rowContainer instanceof HTMLElement) || rowContainer === hint.element) {
    return null;
  }

  const rowRect = getMarkerRect(rowContainer);
  if (!rowRect) {
    return null;
  }

  if (
    rowRect.width < targetRect.width + 96 ||
    rowRect.height > 84 ||
    rowRect.height < targetRect.height
  ) {
    return null;
  }

  return rowRect;
};

const getHideDirectiveAnchorRect = (hint: HintMarker, targetRect: DOMRect): DOMRect | null => {
  if (hint.directive !== "hide") {
    return null;
  }

  let bestRect: DOMRect | null = null;
  let bestArea = 0;

  for (const popup of hint.element.querySelectorAll<HTMLElement>(POPUP_DIALOG_SELECTOR)) {
    const popupRect = getMarkerRect(popup);
    if (!popupRect) {
      continue;
    }

    if (
      popupRect.left < targetRect.left ||
      popupRect.top < targetRect.top ||
      popupRect.right > targetRect.right ||
      popupRect.bottom > targetRect.bottom
    ) {
      continue;
    }

    const area = popupRect.width * popupRect.height;
    if (area > bestArea) {
      bestArea = area;
      bestRect = popupRect;
    }
  }

  return bestRect;
};

const getMarkerPlacementInfo = (
  hint: Pick<HintMarker, "element" | "directive">,
  targetRect: DOMRect,
  mode: LinkMode,
  highlightThumbnails: boolean
): MarkerPlacementInfo => {
  if (!highlightThumbnails || hint.directive !== null) {
    return { variant: "default", anchorRect: targetRect };
  }

  const thumbnailElements = collectUniqueThumbnailElements(hint.element);
  const preferredThumbnailRect = getPreferredThumbnailRect(targetRect, thumbnailElements);
  const useThumbnail =
    mode === "copy-image" && hint.element instanceof HTMLImageElement
      ? targetRect.width >= MIN_COPY_IMAGE_THUMBNAIL_WIDTH &&
        targetRect.height >= MIN_COPY_IMAGE_THUMBNAIL_HEIGHT
      : isThumbnailLikeTarget(targetRect, thumbnailElements, preferredThumbnailRect);

  return {
    variant: useThumbnail ? "thumbnail" : "default",
    anchorRect: useThumbnail ? (preferredThumbnailRect ?? targetRect) : targetRect
  };
};

type PreparedMarkerPlacement = {
  markerWidth: number;
  markerHeight: number;
  markerVariant: MarkerVariant;
  anchorRect: DOMRect;
};

export const prepareMarkerPlacement = (
  hint: HintMarker,
  targetRect: DOMRect,
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
): PreparedMarkerPlacement => {
  const { variant: markerVariant, anchorRect } = getMarkerPlacementInfo(
    hint,
    targetRect,
    mode,
    highlightThumbnails
  );
  const hideAnchorRect =
    markerVariant === "default" ? getHideDirectiveAnchorRect(hint, targetRect) : null;
  const sharedRowAnchorRect =
    markerVariant === "default" ? getCompositeRowAnchorRect(hint, targetRect) : null;
  const placementAnchorRect = hideAnchorRect ?? sharedRowAnchorRect ?? anchorRect;

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

  return {
    markerWidth: hint.markerWidth,
    markerHeight: hint.markerHeight,
    markerVariant,
    anchorRect: placementAnchorRect
  };
};