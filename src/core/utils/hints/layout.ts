import { getMarkerRect } from "~/src/core/utils/hints/hint-recognition";
import { addToCollisionGrid, chooseMarkerRect } from "~/src/core/utils/hints/layout/collision";
import { getMarkerPlacementCandidates } from "~/src/core/utils/hints/layout/placement";
import {
  MARKER_VIEWPORT_PADDING,
  createPlacedMarkerRect,
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

const RESPONSE_ACTION_GROUP_SELECTOR =
  "[aria-label='Response actions'], [aria-label*='actions' i][role='group']";
const RESPONSE_ACTION_ROW_GAP = 6;

const getResponseActionGroup = (element: HTMLElement): HTMLElement | null => {
  return element.closest(RESPONSE_ACTION_GROUP_SELECTOR);
};

const placeResponseActionGroupMarkers = (
  hints: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string,
  collisionGrid?: CollisionGrid
): Set<HintMarker> => {
  const processed = new Set<HintMarker>();
  const hintsByGroup = new Map<HTMLElement, HintMarker[]>();

  for (const hint of hints) {
    const group = getResponseActionGroup(hint.element);
    if (!group) {
      continue;
    }

    const groupHints = hintsByGroup.get(group);
    if (groupHints) {
      groupHints.push(hint);
    } else {
      hintsByGroup.set(group, [hint]);
    }
  }

  for (const groupHints of hintsByGroup.values()) {
    if (groupHints.length < 2) {
      continue;
    }

    const placements = groupHints
      .map((hint) => {
        const placement = prepareVisibleMarker(
          hint,
          mode,
          highlightThumbnails,
          markerVariantStyleAttribute
        );
        if (!placement) {
          return null;
        }

        return {
          hint,
          placement
        };
      })
      .filter(
        (
          value
        ): value is {
          hint: HintMarker;
          placement: NonNullable<ReturnType<typeof prepareVisibleMarker>>;
        } => value !== null
      )
      .sort((left, right) => left.placement.anchorRect.left - right.placement.anchorRect.left);

    if (placements.length < 2) {
      continue;
    }

    const leftEdge = Math.min(...placements.map(({ placement }) => placement.anchorRect.left));
    const rightEdge = Math.max(...placements.map(({ placement }) => placement.anchorRect.right));
    const topEdge = Math.min(...placements.map(({ placement }) => placement.anchorRect.top));
    const maxMarkerHeight = Math.max(...placements.map(({ placement }) => placement.markerHeight));
    const totalWidth =
      placements.reduce((sum, { placement }) => sum + placement.markerWidth, 0) +
      RESPONSE_ACTION_ROW_GAP * (placements.length - 1);
    const rowCenter = (leftEdge + rightEdge) / 2;
    const desiredStartLeft =
      rowCenter - totalWidth / 2 - (placements[0].hint.directive === "copy" ? 4 : 0);
    let currentLeft = Math.max(MARKER_VIEWPORT_PADDING, desiredStartLeft);
    const rowTop = Math.max(MARKER_VIEWPORT_PADDING, topEdge - Math.round(maxMarkerHeight * 0.45));

    for (const { hint, placement } of placements) {
      hint.marker.style.left = `${Math.round(currentLeft)}px`;
      hint.marker.style.top = `${Math.round(rowTop)}px`;

      if (collisionGrid) {
        addToCollisionGrid(
          collisionGrid,
          createPlacedMarkerRect(currentLeft, rowTop, placement.markerWidth, placement.markerHeight)
        );
      }

      currentLeft += placement.markerWidth + RESPONSE_ACTION_ROW_GAP;
      processed.add(hint);
    }
  }

  return processed;
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
  const processed = placeResponseActionGroupMarkers(
    markers,
    mode,
    highlightThumbnails,
    markerVariantStyleAttribute
  );

  for (const hint of markers) {
    if (processed.has(hint)) {
      continue;
    }

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
      hint.element,
      placement.anchorRect,
      placement.markerVariant,
      hint.directive,
      hint.labelIcon,
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
  const processed = placeResponseActionGroupMarkers(
    markersByPlacementPriority,
    mode,
    highlightThumbnails,
    markerVariantStyleAttribute,
    collisionGrid
  );

  for (const hint of markersByPlacementPriority) {
    if (processed.has(hint)) {
      continue;
    }

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
      hint.element,
      placement.anchorRect,
      placement.markerVariant,
      hint.directive,
      hint.labelIcon,
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