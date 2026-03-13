import { getHintableElements } from "~/src/core/actions/hint-recognition";
import type { LinkMode } from "~/src/core/actions/hint-recognition";
import { buildHintLabels } from "~/src/core/utils/hints/labels";
import { assignHintSemantics } from "~/src/core/utils/hints/semantics";
import type { HintLabelPlanSettings, ReservedHintLabels } from "~/src/core/utils/hints/types";

export type HintPipelineTarget = {
  element: HTMLElement;
  label: string;
};

export const collectHintTargets = (mode: LinkMode): HTMLElement[] => {
  return getHintableElements(mode);
};

export const assignHintLabels = (
  elements: HTMLElement[],
  reservedHintLabels: ReservedHintLabels,
  labelSettings: HintLabelPlanSettings
): HintPipelineTarget[] => {
  const { reservedLabelsByIndex, reservedLabels } = assignHintSemantics(
    elements,
    reservedHintLabels
  );
  const { labels } = buildHintLabels(elements.length, reservedLabels, labelSettings);

  const targets: HintPipelineTarget[] = [];
  let labelIndex = 0;

  elements.forEach((element, index) => {
    const label = reservedLabelsByIndex.get(index) ?? labels[labelIndex++];

    if (!label) {
      return;
    }

    targets.push({
      element,
      label
    });
  });

  return targets;
};