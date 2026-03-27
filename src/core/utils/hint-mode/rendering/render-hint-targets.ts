import { getHintContainer } from "~/src/core/utils/hint-mode/rendering/get-hint-container";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

export const renderHintTargets = (targets: HintTarget[]): void => {
  const container = getHintContainer();
  container.replaceChildren(...targets.map((target) => target.marker));
};