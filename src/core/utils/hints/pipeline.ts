import {
  getSuppressedAttachRelatedHintIndexes,
  getHintableElements
} from "~/src/core/utils/hints/hint-recognition";
import type { LinkMode } from "~/src/core/utils/hints/model";
import { buildHintLabels } from "~/src/core/utils/hints/labels";
import { assignHintSemantics } from "~/src/core/utils/hints/semantics";
import type {
  HintLabelPlanSettings,
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/core/utils/hints/types";

export type HintPipelineTarget = {
  element: HTMLElement;
  label: string;
  directive: ReservedHintDirective | null;
};

export const collectHintTargets = (mode: LinkMode): HTMLElement[] => {
  return getHintableElements(mode);
};

const getReservedDirectiveIndex = (
  reservedDirectivesByIndex: ReadonlyMap<number, ReservedHintDirective>,
  directive: ReservedHintDirective
): number | undefined => {
  for (const [index, candidate] of reservedDirectivesByIndex.entries()) {
    if (candidate === directive) {
      return index;
    }
  }

  return undefined;
};

const getSuppressedHintIndexes = (
  elements: HTMLElement[],
  reservedDirectivesByIndex: ReadonlyMap<number, ReservedHintDirective>
): Set<number> => {
  const suppressedIndexes = new Set<number>();
  const attachIndex = getReservedDirectiveIndex(reservedDirectivesByIndex, "attach");

  if (attachIndex === undefined) {
    return suppressedIndexes;
  }

  return getSuppressedAttachRelatedHintIndexes(elements, attachIndex, reservedDirectivesByIndex);
};

export const assignHintLabels = (
  elements: HTMLElement[],
  reservedHintLabels: ReservedHintLabels,
  labelSettings: HintLabelPlanSettings
): HintPipelineTarget[] => {
  const { reservedLabelsByIndex, reservedDirectivesByIndex, reservedLabels } = assignHintSemantics(
    elements,
    reservedHintLabels
  );
  const suppressedIndexes = getSuppressedHintIndexes(elements, reservedDirectivesByIndex);
  const visibleCount = elements.length - suppressedIndexes.size;
  const { labels } = buildHintLabels(visibleCount, reservedLabels, labelSettings);

  const targets: HintPipelineTarget[] = [];
  let labelIndex = 0;

  elements.forEach((element, index) => {
    if (suppressedIndexes.has(index)) {
      return;
    }

    const label = reservedLabelsByIndex.get(index) ?? labels[labelIndex++];

    if (!label) {
      return;
    }

    targets.push({
      element,
      label,
      directive: reservedDirectivesByIndex.get(index) ?? null
    });
  });

  return targets;
};