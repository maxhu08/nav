import { getHintContainer } from "~/src/core/utils/hint-mode/rendering/get-hint-container";
import {
  positionChatGptSidebarTarget,
  positionDeferredChatGptSidebarTargets
} from "~/src/core/utils/hint-mode/rendering/chatgpt-sidebar-placement";
import {
  getChatGptComposerDirectiveCornerRect,
  getChatGptSpecialRowKey,
  getChatGptSpecialRowTop,
  isChatGptHintContext as isChatGptSiteContext,
  shouldPositionChatGptComposerDirectiveInCorner
} from "~/src/core/utils/hint-mode/rendering/sites/chatgpt";
import {
  getYouTubeSpecialRowKey,
  isYouTubeHintContext
} from "~/src/core/utils/hint-mode/rendering/sites/youtube";
import {
  createMarkerPlacementState,
  positionMarkerElementAtTopLeft,
  positionMarkerElement,
  positionMarkerElementAtTop,
  positionMarkerElementInCenter,
  positionMarkerElementInTopRightCorner,
  positionMarkerElementToRightOf
} from "~/src/core/utils/hint-mode/rendering/position-marker-element";
import { HINT_MARKER_MIN_GAP } from "~/src/core/utils/hint-mode/shared/constants";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

type SpecialRowState = {
  lastMarker: HTMLDivElement;
  top: number;
};

const getSpecialRowKey = (
  target: HintTarget,
  siteFlags: { isChatGpt: boolean; isYouTube: boolean }
): string | null => {
  if (siteFlags.isYouTube) {
    return getYouTubeSpecialRowKey(target);
  }

  if (siteFlags.isChatGpt) {
    return getChatGptSpecialRowKey(target);
  }

  return null;
};

const getSpecialRowTop = (
  target: HintTarget,
  siteFlags: { isChatGpt: boolean; isYouTube: boolean }
): number | null => {
  if (siteFlags.isChatGpt) {
    return getChatGptSpecialRowTop(target);
  }

  return null;
};

const markersOverlap = (marker: HTMLDivElement, referenceMarker: HTMLDivElement): boolean => {
  const left = Number.parseFloat(marker.style.left) || 0;
  const top = Number.parseFloat(marker.style.top) || 0;
  const right = left + marker.offsetWidth;
  const bottom = top + marker.offsetHeight;
  const referenceLeft = Number.parseFloat(referenceMarker.style.left) || 0;
  const referenceTop = Number.parseFloat(referenceMarker.style.top) || 0;
  const referenceRight = referenceLeft + referenceMarker.offsetWidth;
  const referenceBottom = referenceTop + referenceMarker.offsetHeight;

  return !(
    right + HINT_MARKER_MIN_GAP <= referenceLeft ||
    left >= referenceRight + HINT_MARKER_MIN_GAP ||
    bottom + HINT_MARKER_MIN_GAP <= referenceTop ||
    top >= referenceBottom + HINT_MARKER_MIN_GAP
  );
};

export const renderHintTargets = (targets: HintTarget[], improveThumbnailMarkers = false): void => {
  const container = getHintContainer();
  const placementState = createMarkerPlacementState();
  const inputTargetsByElement = new Map<HTMLElement, HintTarget>();
  const specialRows = new Map<string, SpecialRowState>();
  const renderedTargetsByElement = new Map<HTMLElement, HintTarget>();
  const deferredPlacementTargets: HintTarget[] = [];
  const fragment = document.createDocumentFragment();
  const siteFlags = {
    isChatGpt: isChatGptSiteContext(),
    isYouTube: isYouTubeHintContext()
  };

  for (const target of targets) {
    fragment.append(target.marker);
  }

  container.replaceChildren(fragment);

  for (const target of targets) {
    const specialRowKey = getSpecialRowKey(target, siteFlags);

    if (target.directiveMatch?.directive === "hide") {
      positionMarkerElementInTopRightCorner(target.marker, target.rect, placementState);
      continue;
    }

    if (target.directiveMatch?.directive === "erase") {
      const inputTarget = inputTargetsByElement.get(target.element);
      if (inputTarget) {
        positionMarkerElementToRightOf(target.marker, inputTarget.marker, placementState);

        if (specialRowKey) {
          const specialRow = specialRows.get(specialRowKey);
          if (specialRow) {
            specialRow.lastMarker = target.marker;
          }
        }

        continue;
      }
    }

    if (siteFlags.isChatGpt && shouldPositionChatGptComposerDirectiveInCorner(target)) {
      positionMarkerElementAtTopLeft(
        target.marker,
        getChatGptComposerDirectiveCornerRect(target) ?? target.rect,
        placementState
      );
      inputTargetsByElement.set(target.element, target);
      renderedTargetsByElement.set(target.element, target);
      continue;
    }

    if (improveThumbnailMarkers && target.isMediaThumbnail && !target.directiveMatch) {
      positionMarkerElementInCenter(target.marker, target.rect, placementState);
      renderedTargetsByElement.set(target.element, target);
      continue;
    }

    if (
      siteFlags.isChatGpt &&
      positionChatGptSidebarTarget(
        target,
        placementState,
        renderedTargetsByElement,
        deferredPlacementTargets
      )
    ) {
      if (target.directiveMatch?.directive === "input") {
        inputTargetsByElement.set(target.element, target);
      }

      renderedTargetsByElement.set(target.element, target);

      continue;
    }

    if (specialRowKey) {
      const specialRowTop = getSpecialRowTop(target, siteFlags) ?? target.rect.top;
      const specialRow = specialRows.get(specialRowKey);

      if (specialRow) {
        positionMarkerElementAtTop(target.marker, target.rect, specialRow.top, placementState);

        if (markersOverlap(target.marker, specialRow.lastMarker)) {
          positionMarkerElementToRightOf(target.marker, specialRow.lastMarker, placementState);
        }

        specialRow.lastMarker = target.marker;
      } else {
        positionMarkerElementAtTop(target.marker, target.rect, specialRowTop, placementState);
        specialRows.set(specialRowKey, {
          lastMarker: target.marker,
          top: Number.parseFloat(target.marker.style.top) || 0
        });
      }

      if (target.directiveMatch?.directive === "input") {
        inputTargetsByElement.set(target.element, target);
      }

      renderedTargetsByElement.set(target.element, target);

      continue;
    }

    positionMarkerElement(target.marker, target.rect, placementState);

    if (target.directiveMatch?.directive === "input") {
      inputTargetsByElement.set(target.element, target);
    }

    renderedTargetsByElement.set(target.element, target);
  }

  if (siteFlags.isChatGpt && deferredPlacementTargets.length > 0) {
    positionDeferredChatGptSidebarTargets(
      deferredPlacementTargets,
      placementState,
      renderedTargetsByElement
    );
  }
};