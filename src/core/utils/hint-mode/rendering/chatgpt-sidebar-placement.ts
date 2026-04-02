import {
  positionMarkerElementAtTopLeft,
  positionMarkerElementAtTopRight,
  positionMarkerElementToRightOf,
  type MarkerPlacementState
} from "~/src/core/utils/hint-mode/rendering/position-marker-element";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

type PlacementOverride = {
  rect: DOMRect;
  strategy: "top-left" | "top-right" | "right-of-marker";
  referenceElement?: HTMLElement;
};

const getPlacementOverride = (target: HintTarget): PlacementOverride | null => {
  const { element } = target;

  if (
    element.matches("[role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']") &&
    element.closest("[role='menu']")
  ) {
    return {
      rect: element.getBoundingClientRect(),
      strategy: "top-right"
    };
  }

  if (
    element.matches("button.icon[data-state='open'], button.icon[data-state='closed']") &&
    element.closest("[data-sidebar-item='true']") &&
    (element.querySelector("[data-testid='project-folder-icon']") ||
      element.querySelector("svg[aria-label]"))
  ) {
    const row = element.closest("[data-sidebar-item='true']");

    if (!(row instanceof HTMLElement)) {
      return null;
    }

    return {
      rect: row.getBoundingClientRect(),
      strategy: "top-left"
    };
  }

  if (element.matches("button.__menu-item-trailing-btn[data-trailing-button]")) {
    const row = element.closest("[data-sidebar-item='true']");

    if (row instanceof HTMLElement) {
      return {
        rect: row.getBoundingClientRect(),
        strategy: "top-right"
      };
    }
  }

  if (element.matches("[data-sidebar-item='true']")) {
    const hasProjectToggle =
      element.querySelector("button.icon[data-state]") instanceof HTMLElement ||
      element.querySelector("[data-testid='project-folder-icon']") instanceof HTMLElement;

    const projectToggle = element.querySelector("button.icon[data-state]");
    if (hasProjectToggle && projectToggle instanceof HTMLElement) {
      return {
        rect: element.getBoundingClientRect(),
        strategy: "right-of-marker",
        referenceElement: projectToggle
      };
    }

    return {
      rect: element.getBoundingClientRect(),
      strategy: "top-left"
    };
  }

  if (
    element.matches("button[aria-expanded]") &&
    element.closest(".group\\/sidebar-expando-section")
  ) {
    const icon = element.querySelector("svg");
    if (icon instanceof SVGElement) {
      return {
        rect: element.getBoundingClientRect(),
        strategy: "top-left"
      };
    }
  }

  return null;
};

export const positionChatGptSidebarTarget = (
  target: HintTarget,
  placementState: MarkerPlacementState,
  renderedTargetsByElement: Map<HTMLElement, HintTarget>,
  deferredPlacementTargets: HintTarget[]
): boolean => {
  const placementOverride = getPlacementOverride(target);

  if (!placementOverride) {
    return false;
  }

  if (placementOverride.strategy === "top-right") {
    positionMarkerElementAtTopRight(target.marker, placementOverride.rect, placementState);
    return true;
  }

  if (placementOverride.strategy === "top-left") {
    positionMarkerElementAtTopLeft(target.marker, placementOverride.rect, placementState);
    return true;
  }

  const referenceTarget =
    placementOverride.referenceElement &&
    renderedTargetsByElement.get(placementOverride.referenceElement);

  if (!referenceTarget) {
    deferredPlacementTargets.push(target);
    return true;
  }

  positionMarkerElementToRightOf(target.marker, referenceTarget.marker, placementState);
  return true;
};

export const positionDeferredChatGptSidebarTargets = (
  deferredPlacementTargets: HintTarget[],
  placementState: MarkerPlacementState,
  renderedTargetsByElement: Map<HTMLElement, HintTarget>
): void => {
  for (const target of deferredPlacementTargets) {
    const placementOverride = getPlacementOverride(target);

    if (!placementOverride || placementOverride.strategy !== "right-of-marker") {
      continue;
    }

    const referenceTarget =
      placementOverride.referenceElement &&
      renderedTargetsByElement.get(placementOverride.referenceElement);

    if (!referenceTarget) {
      continue;
    }

    positionMarkerElementToRightOf(target.marker, referenceTarget.marker, placementState);
    renderedTargetsByElement.set(target.element, target);
  }
};