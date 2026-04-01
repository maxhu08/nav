import { getHintContainer } from "~/src/core/utils/hint-mode/rendering/get-hint-container";
import {
  createMarkerPlacementState,
  positionMarkerElement,
  positionMarkerElementToRightOf
} from "~/src/core/utils/hint-mode/rendering/position-marker-element";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

export const renderHintTargets = (targets: HintTarget[]): void => {
  const container = getHintContainer();
  const placementState = createMarkerPlacementState();
  const inputTargetsByElement = new Map<HTMLElement, HintTarget>();

  container.replaceChildren(...targets.map((target) => target.marker));
  targets.forEach((target) => {
    if (target.directiveMatch?.directive === "erase") {
      const inputTarget = inputTargetsByElement.get(target.element);
      if (inputTarget) {
        positionMarkerElementToRightOf(target.marker, inputTarget.marker, placementState);
        return;
      }
    }

    positionMarkerElement(target.marker, target.rect, placementState);

    if (target.directiveMatch?.directive === "input") {
      inputTargetsByElement.set(target.element, target);
    }
  });
};