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
  const fragment = document.createDocumentFragment();

  for (const target of targets) {
    fragment.append(target.marker);
  }

  container.replaceChildren(fragment);

  for (const target of targets) {
    if (target.directiveMatch?.directive === "erase") {
      const inputTarget = inputTargetsByElement.get(target.element);
      if (inputTarget) {
        positionMarkerElementToRightOf(target.marker, inputTarget.marker, placementState);
        continue;
      }
    }

    positionMarkerElement(target.marker, target.rect, placementState);

    if (target.directiveMatch?.directive === "input") {
      inputTargetsByElement.set(target.element, target);
    }
  }
};