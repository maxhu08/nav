import type { HintMarker, ReservedHintDirective } from "~/src/core/utils/hints/types";

export const MARKER_VIEWPORT_PADDING = 8;
export const MARKER_COLLISION_GAP = 2;
export const MARKER_ANCHOR_INSET = 2;
export const MARKER_COLLISION_CELL_SIZE = 80;
export const MARKER_SEARCH_STEP = 24;
export const MARKER_SEARCH_RINGS = 6;
export const MIN_THUMBNAIL_WIDTH = 96;
export const MIN_THUMBNAIL_HEIGHT = 54;
export const MIN_THUMBNAIL_MEDIA_AREA_RATIO = 0.45;
export const MIN_THUMBNAIL_RECTANGULAR_RATIO = 1.15;
export const MIN_COPY_IMAGE_THUMBNAIL_WIDTH = 180;
export const MIN_COPY_IMAGE_THUMBNAIL_HEIGHT = 120;

export type PlacedMarkerRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type RectLike = Pick<DOMRect, "left" | "top" | "right" | "bottom" | "width" | "height">;
export type MarkerVariant = "default" | "thumbnail";
export type CollisionGrid = Map<number, Map<number, PlacedMarkerRect[]>>;
export type MarkerVisibilityScore = {
  clearPoints: number;
  occludedPoints: number;
};

const DIRECTIVE_LAYOUT_PRIORITIES: Partial<Record<ReservedHintDirective, number>> = {
  attach: 100,
  input: 90,
  submit: 80,
  cancel: 70,
  share: 65,
  download: 64,
  login: 63,
  next: 60,
  prev: 60,
  home: 50,
  sidebar: 40,
  like: 30,
  dislike: 30
};

export const getMarkerLayoutPriority = (
  hint: Pick<HintMarker, "directive" | "labelIcon">
): number => {
  if (hint.directive) {
    return DIRECTIVE_LAYOUT_PRIORITIES[hint.directive] ?? 10;
  }

  return hint.labelIcon ? 12 : 0;
};

export const clampMarkerPosition = (
  left: number,
  top: number,
  width: number,
  height: number
): Pick<PlacedMarkerRect, "left" | "top"> => ({
  left: (() => {
    const viewportWidth = Math.max(0, window.innerWidth - MARKER_VIEWPORT_PADDING * 2);
    const clampedWidth = Math.min(width, viewportWidth);

    return Math.min(
      Math.max(MARKER_VIEWPORT_PADDING, left),
      Math.max(MARKER_VIEWPORT_PADDING, window.innerWidth - clampedWidth - MARKER_VIEWPORT_PADDING)
    );
  })(),
  top: (() => {
    const viewportHeight = Math.max(0, window.innerHeight - MARKER_VIEWPORT_PADDING * 2);
    const clampedHeight = Math.min(height, viewportHeight);

    return Math.min(
      Math.max(MARKER_VIEWPORT_PADDING, top),
      Math.max(
        MARKER_VIEWPORT_PADDING,
        window.innerHeight - clampedHeight - MARKER_VIEWPORT_PADDING
      )
    );
  })()
});

export const createPlacedMarkerRect = (
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

export const isRectWithinViewport = (rect: RectLike): boolean =>
  rect.right > 0 &&
  rect.bottom > 0 &&
  rect.left < window.innerWidth &&
  rect.top < window.innerHeight;