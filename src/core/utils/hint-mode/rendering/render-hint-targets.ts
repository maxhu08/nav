import { getHintContainer } from "~/src/core/utils/hint-mode/rendering/get-hint-container";
import {
  positionChatGptSidebarTarget,
  positionDeferredChatGptSidebarTargets
} from "~/src/core/utils/hint-mode/rendering/chatgpt-sidebar-placement";
import { getChatGptSpecialRowKey } from "~/src/core/utils/hint-mode/rendering/sites/chatgpt";
import { getYouTubeSpecialRowKey } from "~/src/core/utils/hint-mode/rendering/sites/youtube";
import {
  createMarkerPlacementState,
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

const getSpecialRowKey = (target: HintTarget): string | null => {
  return getYouTubeSpecialRowKey(target) ?? getChatGptSpecialRowKey(target);
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

  for (const target of targets) {
    fragment.append(target.marker);
  }

  container.replaceChildren(fragment);

  for (const target of targets) {
    const specialRowKey = getSpecialRowKey(target);

    if (target.directiveMatch?.directive === "hide") {
      positionMarkerElementInTopRightCorner(
        target.marker,
        target.element.getBoundingClientRect(),
        placementState
      );
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

    if (improveThumbnailMarkers && target.isMediaThumbnail) {
      positionMarkerElementInCenter(target.marker, target.rect, placementState);
      renderedTargetsByElement.set(target.element, target);
      continue;
    }

    if (
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
      const specialRow = specialRows.get(specialRowKey);

      if (specialRow) {
        positionMarkerElementAtTop(target.marker, target.rect, specialRow.top, placementState);

        if (markersOverlap(target.marker, specialRow.lastMarker)) {
          positionMarkerElementToRightOf(target.marker, specialRow.lastMarker, placementState);
        }

        specialRow.lastMarker = target.marker;
      } else {
        positionMarkerElementAtTop(target.marker, target.rect, target.rect.top, placementState);
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

  positionDeferredChatGptSidebarTargets(
    deferredPlacementTargets,
    placementState,
    renderedTargetsByElement
  );
};