import type { MarkerVariant } from "~/src/core/utils/hints/layout/shared";
import type { HintMarker } from "~/src/core/utils/hints/types";

export type MarkerPlacementInfo = {
  variant: MarkerVariant;
  anchorRect: DOMRect;
};

export type PreparedMarkerPlacement = {
  markerWidth: number;
  markerHeight: number;
  markerVariant: MarkerVariant;
  anchorRect: DOMRect;
};

export type VisibleMarkerPlacement = PreparedMarkerPlacement & {
  targetRect: DOMRect;
};

export type AlignedMarkerPlacement = {
  hint: HintMarker;
  markerHeight: number;
  markerWidth: number;
  targetRect: DOMRect;
};