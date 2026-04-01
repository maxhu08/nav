import { getHintContainer } from "~/src/core/utils/hint-mode/rendering/get-hint-container";
import {
  createMarkerPlacementState,
  positionMarkerElement
} from "~/src/core/utils/hint-mode/rendering/position-marker-element";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

export const renderHintTargets = (targets: HintTarget[]): void => {
  const container = getHintContainer();
  const placementState = createMarkerPlacementState();

  container.replaceChildren(...targets.map((target) => target.marker));
  targets.forEach((target) => {
    positionMarkerElement(target.marker, target.rect, placementState);
  });
};