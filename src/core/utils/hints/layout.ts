import { getMarkerRect } from "~/src/core/utils/hints/hint-recognition";
import { addToCollisionGrid, chooseMarkerRect } from "~/src/core/utils/hints/layout/collision";
import { getMarkerPlacementCandidates } from "~/src/core/utils/hints/layout/placement";
import {
  getMarkerLayoutPriority,
  isRectWithinViewport,
  type CollisionGrid
} from "~/src/core/utils/hints/layout/shared";
import { prepareMarkerPlacement } from "~/src/core/utils/hints/layout/thumbnail";
export { revealVideoHintControls } from "~/src/core/utils/hints/layout/video";
import type { LinkMode } from "~/src/core/utils/hints/model";
import type { HintMarker } from "~/src/core/utils/hints/types";

const hideMarker = (hint: HintMarker): void => {
  if (hint.marker.style.display !== "none") {
    hint.marker.style.display = "none";
  }
};

const showMarker = (hint: HintMarker): void => {
  if (hint.marker.style.display === "none") {
    hint.marker.style.display = "";
  }
};

const prepareVisibleMarker = (
  hint: HintMarker,
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
) => {
  const targetRect = getMarkerRect(hint.element);

  if (!targetRect || !isRectWithinViewport(targetRect)) {
    hideMarker(hint);
    return null;
  }

  showMarker(hint);

  const placement = prepareMarkerPlacement(
    hint,
    targetRect,
    mode,
    highlightThumbnails,
    markerVariantStyleAttribute
  );

  hint.marker.style.zIndex = `${1000 + getMarkerLayoutPriority(hint)}`;
  return placement;
};

export const primeMarkerPositions = (
  markers: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
): void => {
  for (const hint of markers) {
    const placement = prepareVisibleMarker(
      hint,
      mode,
      highlightThumbnails,
      markerVariantStyleAttribute
    );
    if (!placement) {
      continue;
    }

    const [firstCandidate] = getMarkerPlacementCandidates(
      placement.anchorRect,
      placement.markerVariant,
      hint.directive,
      placement.markerWidth,
      placement.markerHeight
    );

    hint.marker.style.left = `${Math.round(firstCandidate.left)}px`;
    hint.marker.style.top = `${Math.round(firstCandidate.top)}px`;
  }
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
    const placement = prepareVisibleMarker(
      hint,
      mode,
      highlightThumbnails,
      markerVariantStyleAttribute
    );
    if (!placement) {
      continue;
    }

    const candidates = getMarkerPlacementCandidates(
      placement.anchorRect,
      placement.markerVariant,
      hint.directive,
      placement.markerWidth,
      placement.markerHeight
    );
    const chosenRect = chooseMarkerRect(
      hint.element,
      placement.markerVariant,
      candidates,
      placement.markerWidth,
      placement.markerHeight,
      collisionGrid
    );

    if (!chosenRect) {
      hideMarker(hint);
      continue;
    }

    hint.marker.style.left = `${Math.round(chosenRect.left)}px`;
    hint.marker.style.top = `${Math.round(chosenRect.top)}px`;
    addToCollisionGrid(collisionGrid, chosenRect);
  }
};