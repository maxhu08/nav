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
  if (
    target.element.matches(
      "[role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']"
    ) &&
    target.element.closest("[role='menu']")
  ) {
    return {
      rect: target.rect,
      strategy: "top-right"
    };
  }

  if (
    target.element.matches("button.icon[data-state='open'], button.icon[data-state='closed']") &&
    target.element.closest("[data-sidebar-item='true']") &&
    (target.element.querySelector("[data-testid='project-folder-icon']") ||
      target.element.querySelector("svg[aria-label]"))
  ) {
    const row = target.element.closest("[data-sidebar-item='true']");

    if (!(row instanceof HTMLElement)) {
      return null;
    }

    return {
      rect: row.getBoundingClientRect(),
      strategy: "top-left"
    };
  }

  if (target.element.matches("button.__menu-item-trailing-btn[data-trailing-button]")) {
    const row = target.element.closest("[data-sidebar-item='true']");

    if (row instanceof HTMLElement) {
      return {
        rect: row.getBoundingClientRect(),
        strategy: "top-right"
      };
    }
  }

  if (target.element.matches("[data-sidebar-item='true']")) {
    const hasProjectToggle =
      target.element.querySelector("button.icon[data-state]") instanceof HTMLElement ||
      target.element.querySelector("[data-testid='project-folder-icon']") instanceof HTMLElement;

    const projectToggle = target.element.querySelector("button.icon[data-state]");
    if (hasProjectToggle && projectToggle instanceof HTMLElement) {
      return {
        rect: target.rect,
        strategy: "right-of-marker",
        referenceElement: projectToggle
      };
    }

    return {
      rect: target.rect,
      strategy: "top-left"
    };
  }

  if (
    target.element.matches("button[aria-expanded]") &&
    target.element.closest(".group\\/sidebar-expando-section")
  ) {
    const icon = target.element.querySelector("svg");
    if (icon instanceof SVGElement) {
      return {
        rect: target.rect,
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