import { HINT_MARKER_EDGE_GAP } from "~/src/core/utils/hint-mode/shared/constants";

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const clampToViewport = (position: number, size: number, viewportSize: number): number => {
  const min = HINT_MARKER_EDGE_GAP;
  const max = Math.max(min, viewportSize - HINT_MARKER_EDGE_GAP - size);
  return clamp(Math.round(position), min, max);
};

export const positionMarkerElement = (marker: HTMLDivElement, rect: DOMRect): void => {
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;
  marker.style.left = `${clampToViewport(rect.left, width, window.innerWidth)}px`;
  marker.style.top = `${clampToViewport(rect.top, height, window.innerHeight)}px`;
};