import {
  HINT_MARKER_EDGE_GAP,
  HINT_MARKER_MIN_GAP
} from "~/src/core/utils/hint-mode/shared/constants";

type MarkerPlacementState = {
  previousMarkerBounds: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  } | null;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const clampToViewport = (position: number, size: number, viewportSize: number): number => {
  const min = HINT_MARKER_EDGE_GAP;
  const max = Math.max(min, viewportSize - HINT_MARKER_EDGE_GAP - size);
  return clamp(Math.round(position), min, max);
};

const boundsOverlap = (
  left: number,
  top: number,
  width: number,
  height: number,
  bounds: NonNullable<MarkerPlacementState["previousMarkerBounds"]>
): boolean => {
  const right = left + width;
  const bottom = top + height;

  return !(
    right + HINT_MARKER_MIN_GAP <= bounds.left ||
    left >= bounds.right + HINT_MARKER_MIN_GAP ||
    bottom + HINT_MARKER_MIN_GAP <= bounds.top ||
    top >= bounds.bottom + HINT_MARKER_MIN_GAP
  );
};

export const createMarkerPlacementState = (): MarkerPlacementState => {
  return {
    previousMarkerBounds: null
  };
};

export const positionMarkerElement = (
  marker: HTMLDivElement,
  rect: DOMRect,
  placementState: MarkerPlacementState
): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  const left = clampToViewport(rect.left, width, window.innerWidth);
  const preferredTop = clampToViewport(rect.top, height, window.innerHeight);
  const previousMarkerBounds = placementState.previousMarkerBounds;
  const top =
    previousMarkerBounds && boundsOverlap(left, preferredTop, width, height, previousMarkerBounds)
      ? clampToViewport(
          previousMarkerBounds.bottom + HINT_MARKER_MIN_GAP,
          height,
          window.innerHeight
        )
      : preferredTop;

  placementState.previousMarkerBounds = {
    bottom: top + height,
    left,
    right: left + width,
    top
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};