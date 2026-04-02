import {
  HINT_MARKER_EDGE_GAP,
  HINT_MARKER_MIN_GAP,
  MARKER_ICON_ATTRIBUTE,
  MARKER_LABEL_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";

export type MarkerPlacementState = {
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

export const getMarkerAnchorWidth = (marker: HTMLDivElement): number => {
  const width = marker.offsetWidth;

  if (!marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)) {
    return width;
  }

  const label = marker.querySelector(`[${MARKER_LABEL_ATTRIBUTE}="true"]`);

  if (!(label instanceof HTMLElement)) {
    return width;
  }

  return label.offsetWidth;
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
  const anchorWidth = getMarkerAnchorWidth(marker);
  const visualLeft = clampToViewport(
    rect.left - width * 0.2 + (width - anchorWidth) * 0.2,
    width,
    window.innerWidth
  );
  const left = visualLeft + width * 0.2;
  const preferredTop = clampToViewport(rect.top, height, window.innerHeight);
  const previousMarkerBounds = placementState.previousMarkerBounds;
  const top =
    previousMarkerBounds &&
    boundsOverlap(visualLeft, preferredTop, width, height, previousMarkerBounds)
      ? clampToViewport(
          previousMarkerBounds.bottom + HINT_MARKER_MIN_GAP,
          height,
          window.innerHeight
        )
      : preferredTop;

  placementState.previousMarkerBounds = {
    bottom: top + height,
    left: visualLeft,
    right: visualLeft + width,
    top
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};

export const positionMarkerElementAtTop = (
  marker: HTMLDivElement,
  rect: DOMRect,
  top: number,
  placementState: MarkerPlacementState
): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  const anchorWidth = getMarkerAnchorWidth(marker);
  const visualLeft = clampToViewport(
    rect.left - width * 0.2 + (width - anchorWidth) * 0.2,
    width,
    window.innerWidth
  );
  const left = visualLeft + width * 0.2;
  const clampedTop = clampToViewport(top, height, window.innerHeight);

  placementState.previousMarkerBounds = {
    bottom: clampedTop + height,
    left: visualLeft,
    right: visualLeft + width,
    top: clampedTop
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${clampedTop}px`;
};

export const positionMarkerElementAtTopLeft = (
  marker: HTMLDivElement,
  rect: DOMRect,
  placementState: MarkerPlacementState
): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  const anchorWidth = getMarkerAnchorWidth(marker);
  const visualLeft = clampToViewport(
    rect.left - width * 0.2 + (width - anchorWidth) * 0.2,
    width,
    window.innerWidth
  );
  const left = visualLeft + width * 0.2;
  const top = clampToViewport(rect.top, height, window.innerHeight);

  placementState.previousMarkerBounds = {
    bottom: top + height,
    left: visualLeft,
    right: visualLeft + width,
    top
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};

export const positionMarkerElementAtTopRight = (
  marker: HTMLDivElement,
  rect: DOMRect,
  placementState: MarkerPlacementState
): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  const left = clampToViewport(rect.right - width, width, window.innerWidth);
  const top = clampToViewport(rect.top, height, window.innerHeight);

  placementState.previousMarkerBounds = {
    bottom: top + height,
    left,
    right: left + width,
    top
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};

export const positionMarkerElementToRightOf = (
  marker: HTMLDivElement,
  referenceMarker: HTMLDivElement,
  placementState: MarkerPlacementState,
  referenceWidth = referenceMarker.offsetWidth
): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  const referenceLeft = Number.parseInt(referenceMarker.style.left, 10) || 0;
  const referenceTop = Number.parseInt(referenceMarker.style.top, 10) || 0;
  const left = clampToViewport(
    referenceLeft + referenceWidth + HINT_MARKER_MIN_GAP,
    width,
    window.innerWidth
  );
  const top = clampToViewport(referenceTop, height, window.innerHeight);

  placementState.previousMarkerBounds = {
    bottom: top + height,
    left,
    right: left + width,
    top
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};

export const positionMarkerElementToLeftOf = (
  marker: HTMLDivElement,
  referenceMarker: HTMLDivElement,
  placementState: MarkerPlacementState
): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  const referenceLeft = Number.parseFloat(referenceMarker.style.left) || 0;
  const referenceTop = Number.parseFloat(referenceMarker.style.top) || 0;
  const left = clampToViewport(
    referenceLeft - width - HINT_MARKER_MIN_GAP,
    width,
    window.innerWidth
  );
  const top = clampToViewport(referenceTop, height, window.innerHeight);

  placementState.previousMarkerBounds = {
    bottom: top + height,
    left,
    right: left + width,
    top
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};

export const positionMarkerElementInTopRightCorner = (
  marker: HTMLDivElement,
  rect: DOMRect,
  placementState: MarkerPlacementState
): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  const left = clampToViewport(rect.right - width * 0.45, width, window.innerWidth);
  const top = clampToViewport(rect.top - height * 0.45, height, window.innerHeight);

  placementState.previousMarkerBounds = {
    bottom: top + height,
    left,
    right: left + width,
    top
  };

  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};