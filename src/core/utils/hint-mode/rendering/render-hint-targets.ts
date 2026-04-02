import { getHintContainer } from "~/src/core/utils/hint-mode/rendering/get-hint-container";
import {
  positionChatGptSidebarTarget,
  positionDeferredChatGptSidebarTargets
} from "~/src/core/utils/hint-mode/rendering/chatgpt-sidebar-placement";
import {
  createMarkerPlacementState,
  positionMarkerElement,
  positionMarkerElementAtTop,
  positionMarkerElementInTopRightCorner,
  positionMarkerElementToRightOf
} from "~/src/core/utils/hint-mode/rendering/position-marker-element";
import { HINT_MARKER_MIN_GAP } from "~/src/core/utils/hint-mode/shared/constants";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

type SpecialRowState = {
  lastMarker: HTMLDivElement;
  top: number;
};

const isYouTubeMastheadStartTarget = (element: HTMLElement): boolean => {
  if (!element.closest("ytd-masthead #start")) {
    return false;
  }

  return (
    element.matches("button[aria-label='Back']") ||
    element.matches("button[aria-label='Guide']") ||
    (element.matches("a#logo[href='/']") &&
      element.matches("[title='YouTube Home']") &&
      !!element.closest("ytd-topbar-logo-renderer#logo"))
  );
};

const isYouTubeMastheadEndTarget = (element: HTMLElement): boolean => {
  if (!element.closest("ytd-masthead #end")) {
    return false;
  }

  return (
    (element.matches("button[aria-label='Notifications']") &&
      !!element.closest("ytd-notification-topbar-button-renderer")) ||
    (element.matches("button#avatar-btn[aria-label='Account menu']") &&
      !!element.closest("ytd-topbar-menu-button-renderer"))
  );
};

const isChatGptComposerTarget = (element: HTMLElement): boolean => {
  const composerSurface = element.closest(
    "form[data-type='unified-composer'] [data-composer-surface='true']"
  );

  if (!composerSurface) {
    return false;
  }

  return (
    element.matches("#composer-plus-btn[aria-label='Add files and more']") ||
    element.matches(
      "#prompt-textarea.ProseMirror[role='textbox'][aria-label='Chat with ChatGPT']"
    ) ||
    element.matches("button[aria-label='Start dictation']") ||
    element.matches("button[aria-label='Start Voice']")
  );
};

const getSpecialRowKey = (target: HintTarget): string | null => {
  if (isYouTubeMastheadStartTarget(target.element)) {
    return "youtube-masthead-start";
  }

  if (isYouTubeMastheadEndTarget(target.element)) {
    return "youtube-masthead-end";
  }

  if (isChatGptComposerTarget(target.element)) {
    return "chatgpt-composer";
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

export const renderHintTargets = (targets: HintTarget[]): void => {
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