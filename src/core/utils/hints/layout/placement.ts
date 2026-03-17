import type { ReservedHintDirective } from "~/src/core/utils/hints/types";
import {
  MARKER_ANCHOR_INSET,
  MARKER_SEARCH_RINGS,
  MARKER_SEARCH_STEP,
  clampMarkerPosition,
  type MarkerVariant,
  type PlacedMarkerRect
} from "~/src/core/utils/hints/layout/shared";

export const getMarkerPlacementCandidates = (
  anchorRect: DOMRect,
  markerVariant: MarkerVariant,
  directive: ReservedHintDirective | null,
  markerWidth: number,
  markerHeight: number
): Array<Pick<PlacedMarkerRect, "left" | "top">> => {
  const shouldHighlightThumbnail = markerVariant === "thumbnail";
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

  if (directive !== null && !shouldHighlightThumbnail) {
    pushCandidate(left, top);
    pushCandidate(right, top);
    pushCandidate(left, bottom);
    pushCandidate(right, bottom);
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