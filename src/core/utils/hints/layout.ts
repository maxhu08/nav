import { getMarkerRect } from "~/src/core/utils/hints/hint-recognition";
import {
  addToCollisionGrid,
  chooseMarkerRect,
  hasCollision
} from "~/src/core/utils/hints/layout/collision";
import { getMarkerPlacementCandidates } from "~/src/core/utils/hints/layout/placement";
import {
  MARKER_VIEWPORT_PADDING,
  createPlacedMarkerRect,
  getMarkerLayoutPriority,
  isRectWithinViewport,
  type CollisionGrid
} from "~/src/core/utils/hints/layout/shared";
import { prepareMarkerPlacement } from "~/src/core/utils/hints/layout/thumbnail";
import type {
  AlignedMarkerPlacement,
  VisibleMarkerPlacement
} from "~/src/core/utils/hints/layout/types";
export { revealVideoHintControls } from "~/src/core/utils/hints/layout/video";
import type { LinkMode } from "~/src/core/utils/hints/model";
import type { HintMarker } from "~/src/core/utils/hints/types";

const hideMarker = (hint: HintMarker): void => {
  if (hint.marker.style.getPropertyValue("display") !== "none") {
    hint.marker.style.setProperty("display", "none", "important");
  }
};

const showMarker = (hint: HintMarker): void => {
  if (hint.marker.style.getPropertyValue("display") === "none") {
    hint.marker.style.setProperty("display", "inline-flex", "important");
  }
};

const RESPONSE_ACTION_GROUP_SELECTOR =
  "[aria-label='Response actions'], [aria-label*='actions' i][role='group']";
const RESPONSE_ACTION_ROW_GAP = 6;
const NAVBAR_CONTAINER_SELECTOR = [
  "header",
  "[role='banner']",
  "[id*='masthead' i]",
  "[class*='masthead' i]",
  "[id*='topbar' i]",
  "[class*='topbar' i]",
  "[id*='navbar' i]",
  "[class*='navbar' i]"
].join(", ");
const TOP_LEFT_ALIGNED_CONTROL_CONTAINER_SELECTOR = [
  "ytd-shorts-player-controls",
  "[id='top-row']",
  "[id='actions']",
  "[id='actions-inner']",
  "[id='button-bar']",
  "[id*='action-bar' i]",
  "[class*='control-bar' i]",
  "[class*='action-bar' i]",
  "[class*='watch-metadata' i]",
  "[class*='reel-action-bar' i]",
  "[id*='player-controls' i]",
  "[class*='player-controls' i]",
  "[class*='shorts-player-controls' i]",
  "[role='tablist']"
].join(", ");
const COMPOSITE_ROW_SELECTOR = [
  "a[href]",
  "[role='link']",
  "[data-sidebar-item]",
  "[tabindex]:not([tabindex='-1']):not([role='group'])"
].join(", ");

const getResponseActionGroup = (element: HTMLElement): HTMLElement | null => {
  return element.closest(RESPONSE_ACTION_GROUP_SELECTOR);
};

const getAncestorMatches = (
  element: HTMLElement,
  predicate: (candidate: HTMLElement) => boolean,
  stopAtBody = true
): HTMLElement[] => {
  const matches: HTMLElement[] = [];
  let current = element.parentElement;

  while (current && (!stopAtBody || current !== document.body)) {
    if (predicate(current)) {
      matches.push(current);
    }

    current = current.parentElement;
  }

  return matches;
};

const getOutermostMatchingAncestor = (
  element: HTMLElement,
  selector: string
): HTMLElement | null => {
  return getAncestorMatches(element, (candidate) => candidate.matches(selector)).at(-1) ?? null;
};

const getNavbarContainer = (element: HTMLElement): HTMLElement | null => {
  return getOutermostMatchingAncestor(element, NAVBAR_CONTAINER_SELECTOR);
};

const getTopLeftAlignedContainer = (element: HTMLElement): HTMLElement | null => {
  return getOutermostMatchingAncestor(element, TOP_LEFT_ALIGNED_CONTROL_CONTAINER_SELECTOR);
};

const getHorizontalBarContainerCandidates = (element: HTMLElement): HTMLElement[] => {
  const compositeRow = element.parentElement?.closest(COMPOSITE_ROW_SELECTOR);
  if (compositeRow instanceof HTMLElement && compositeRow !== element) {
    return [];
  }

  return getAncestorMatches(element, (candidate) => {
    if (
      candidate.matches(NAVBAR_CONTAINER_SELECTOR) ||
      candidate.matches(TOP_LEFT_ALIGNED_CONTROL_CONTAINER_SELECTOR) ||
      candidate.matches(RESPONSE_ACTION_GROUP_SELECTOR)
    ) {
      return false;
    }

    const rect = getMarkerRect(candidate);
    return (
      !!rect &&
      rect.height >= 24 &&
      rect.height <= 96 &&
      rect.width >= Math.max(180, rect.height * 1.75)
    );
  });
};

const doRectsShareNavbarRow = (left: DOMRect, right: DOMRect): boolean => {
  const overlapTop = Math.max(left.top, right.top);
  const overlapBottom = Math.min(left.bottom, right.bottom);
  const overlapHeight = Math.max(0, overlapBottom - overlapTop);
  const minHeight = Math.max(1, Math.min(left.height, right.height));
  const centerDelta = Math.abs(left.top + left.height / 2 - (right.top + right.height / 2));

  return overlapHeight / minHeight >= 0.45 || centerDelta <= Math.max(18, minHeight * 0.6);
};

const collectAlignedPlacements = (
  hints: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
): AlignedMarkerPlacement[] => {
  return hints
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
        markerHeight: placement.markerHeight,
        markerWidth: placement.markerWidth,
        targetRect: placement.targetRect
      };
    })
    .filter((value): value is AlignedMarkerPlacement => value !== null)
    .sort((left, right) => {
      if (left.targetRect.top !== right.targetRect.top) {
        return left.targetRect.top - right.targetRect.top;
      }

      return left.targetRect.left - right.targetRect.left;
    });
};

const splitPlacementsIntoRows = (
  placements: readonly AlignedMarkerPlacement[]
): AlignedMarkerPlacement[][] => {
  const rows: AlignedMarkerPlacement[][] = [];

  for (const placement of placements) {
    const lastRow = rows.at(-1);
    if (!lastRow || !doRectsShareNavbarRow(lastRow[0].targetRect, placement.targetRect)) {
      rows.push([placement]);
      continue;
    }

    lastRow.push(placement);
  }

  return rows;
};

const placeAlignedRows = (
  rows: readonly AlignedMarkerPlacement[][],
  processed: Set<HintMarker>,
  collisionGrid?: CollisionGrid,
  minimumRowSize = 1
): void => {
  for (const rowPlacements of rows) {
    if (rowPlacements.length < minimumRowSize) {
      continue;
    }

    const alignedTop = Math.max(
      MARKER_VIEWPORT_PADDING,
      Math.round(Math.min(...rowPlacements.map(({ targetRect }) => targetRect.top)) + 2)
    );

    rowPlacements.sort((left, right) => left.targetRect.left - right.targetRect.left);

    for (const { hint, markerHeight, markerWidth, targetRect } of rowPlacements) {
      let left = Math.round(targetRect.left + 2);
      const top = alignedTop;

      if (collisionGrid) {
        let nextRect = createPlacedMarkerRect(left, top, markerWidth, markerHeight);
        while (hasCollision(collisionGrid, nextRect) && left < Math.round(targetRect.right)) {
          left += 1;
          nextRect = createPlacedMarkerRect(left, top, markerWidth, markerHeight);
        }

        addToCollisionGrid(collisionGrid, nextRect);
      }

      hint.marker.style.left = `${left}px`;
      hint.marker.style.top = `${top}px`;
      processed.add(hint);
    }
  }
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

const placeNavbarMarkers = (
  hints: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string,
  collisionGrid?: CollisionGrid
): Set<HintMarker> => {
  const processed = new Set<HintMarker>();
  const hintsByNavbar = new Map<HTMLElement, HintMarker[]>();

  for (const hint of hints) {
    if (hint.directive === "input" || hint.directive === "erase") {
      continue;
    }

    const navbar = getNavbarContainer(hint.element);
    if (!navbar) {
      continue;
    }

    const navbarHints = hintsByNavbar.get(navbar);
    if (navbarHints) {
      navbarHints.push(hint);
    } else {
      hintsByNavbar.set(navbar, [hint]);
    }
  }

  for (const navbarHints of hintsByNavbar.values()) {
    if (navbarHints.length < 2) {
      continue;
    }

    const placements = collectAlignedPlacements(
      navbarHints,
      mode,
      highlightThumbnails,
      markerVariantStyleAttribute
    );

    if (placements.length < 2) {
      continue;
    }

    placeAlignedRows(splitPlacementsIntoRows(placements), processed, collisionGrid);
  }

  return processed;
};

const placeTopLeftAlignedGroupMarkers = (
  hints: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string,
  collisionGrid?: CollisionGrid
): Set<HintMarker> => {
  const processed = new Set<HintMarker>();
  const hintsByContainer = new Map<HTMLElement, HintMarker[]>();

  for (const hint of hints) {
    const container = getTopLeftAlignedContainer(hint.element);
    if (!container) {
      continue;
    }

    const groupHints = hintsByContainer.get(container);
    if (groupHints) {
      groupHints.push(hint);
    } else {
      hintsByContainer.set(container, [hint]);
    }
  }

  for (const groupHints of hintsByContainer.values()) {
    if (groupHints.length < 2) {
      continue;
    }

    const placements = collectAlignedPlacements(
      groupHints,
      mode,
      highlightThumbnails,
      markerVariantStyleAttribute
    );

    if (placements.length < 2) {
      continue;
    }

    placeAlignedRows(splitPlacementsIntoRows(placements), processed, collisionGrid);
  }

  return processed;
};

const placeHorizontalBarMarkers = (
  hints: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string,
  collisionGrid?: CollisionGrid
): Set<HintMarker> => {
  const processed = new Set<HintMarker>();
  const hintsByContainer = new Map<HTMLElement, HintMarker[]>();
  const containerDepth = new Map<HTMLElement, number>();

  for (const hint of hints) {
    const candidates = getHorizontalBarContainerCandidates(hint.element);
    for (let index = 0; index < candidates.length; index += 1) {
      const container = candidates[index];
      const groupHints = hintsByContainer.get(container);
      if (groupHints) {
        groupHints.push(hint);
      } else {
        hintsByContainer.set(container, [hint]);
        containerDepth.set(container, index);
      }
    }
  }

  const eligibleContainers = Array.from(hintsByContainer.entries())
    .filter(([, groupHints]) => groupHints.length >= 2)
    .sort(
      (left, right) => (containerDepth.get(left[0]) ?? 0) - (containerDepth.get(right[0]) ?? 0)
    );

  for (const [, groupHints] of eligibleContainers) {
    const availableHints = groupHints.filter((hint) => !processed.has(hint));
    if (availableHints.length < 2) {
      continue;
    }

    const placements = collectAlignedPlacements(
      availableHints,
      mode,
      highlightThumbnails,
      markerVariantStyleAttribute
    );

    if (placements.length < 2) {
      continue;
    }

    placeAlignedRows(splitPlacementsIntoRows(placements), processed, collisionGrid, 2);
  }

  return processed;
};

const prepareVisibleMarker = (
  hint: HintMarker,
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
): VisibleMarkerPlacement | null => {
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
  return {
    ...placement,
    targetRect
  };
};

export const primeMarkerPositions = (
  markers: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
): void => {
  updateMarkersInternal(markers, mode, highlightThumbnails, markerVariantStyleAttribute, false);
};

export const updateMarkerPositions = (
  markers: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string
): void => {
  updateMarkersInternal(markers, mode, highlightThumbnails, markerVariantStyleAttribute, true);
};

const updateMarkersInternal = (
  markers: HintMarker[],
  mode: LinkMode,
  highlightThumbnails: boolean,
  markerVariantStyleAttribute: string,
  collisionAware: boolean
): void => {
  const collisionGrid: CollisionGrid | undefined = collisionAware ? new Map() : undefined;
  const markersByPlacementPriority = collisionAware
    ? [...markers].sort(
        (left, right) => getMarkerLayoutPriority(right) - getMarkerLayoutPriority(left)
      )
    : markers;
  const processed = placeResponseActionGroupMarkers(
    markersByPlacementPriority,
    mode,
    highlightThumbnails,
    markerVariantStyleAttribute,
    collisionGrid
  );
  const navbarProcessed = placeNavbarMarkers(
    markersByPlacementPriority,
    mode,
    highlightThumbnails,
    markerVariantStyleAttribute,
    collisionGrid
  );
  const topLeftAlignedProcessed = placeTopLeftAlignedGroupMarkers(
    markersByPlacementPriority,
    mode,
    highlightThumbnails,
    markerVariantStyleAttribute,
    collisionGrid
  );
  const horizontalBarProcessed = placeHorizontalBarMarkers(
    markersByPlacementPriority.filter(
      (hint) =>
        !processed.has(hint) && !navbarProcessed.has(hint) && !topLeftAlignedProcessed.has(hint)
    ),
    mode,
    highlightThumbnails,
    markerVariantStyleAttribute,
    collisionGrid
  );

  for (const hint of markersByPlacementPriority) {
    if (
      processed.has(hint) ||
      navbarProcessed.has(hint) ||
      topLeftAlignedProcessed.has(hint) ||
      horizontalBarProcessed.has(hint)
    ) {
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
    const chosenRect = collisionGrid
      ? chooseMarkerRect(
          hint.element,
          placement.markerVariant,
          candidates,
          placement.markerWidth,
          placement.markerHeight,
          collisionGrid
        )
      : candidates[0]
        ? createPlacedMarkerRect(
            candidates[0].left,
            candidates[0].top,
            placement.markerWidth,
            placement.markerHeight
          )
        : null;

    if (!chosenRect) {
      hideMarker(hint);
      continue;
    }

    hint.marker.style.left = `${Math.round(chosenRect.left)}px`;
    hint.marker.style.top = `${Math.round(chosenRect.top)}px`;
    if (collisionGrid) {
      addToCollisionGrid(collisionGrid, chosenRect);
    }
  }
};