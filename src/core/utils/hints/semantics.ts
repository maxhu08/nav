import { getPreferredDirectiveIndexes } from "~/src/core/utils/hints/hint-recognition";
import { doesLabelConflictWithReservedLabels } from "~/src/core/utils/hints/labels";
import type { ReservedHintDirective, ReservedHintLabels } from "~/src/core/utils/hints/types";
import { RESERVED_HINT_DIRECTIVES } from "~/src/utils/hint-reserved-label-directives";

const RESERVED_LABEL_PATTERN = /^[a-z]+$/;

const isPreferredLabelValid = (label: string): boolean => {
  return label.length > 0 && RESERVED_LABEL_PATTERN.test(label);
};

const getPreferredReservedLabel = (labels: string[]): string | null => {
  for (const candidateLabel of labels) {
    if (isPreferredLabelValid(candidateLabel)) {
      return candidateLabel;
    }
  }

  return null;
};

export const assignHintSemantics = (
  elements: HTMLElement[],
  reservedHintLabels: ReservedHintLabels
): {
  reservedLabelsByIndex: Map<number, string>;
  reservedDirectivesByIndex: Map<number, ReservedHintDirective>;
  reservedLabels: string[];
} => {
  const preferredIndexes = getPreferredDirectiveIndexes(elements);
  const reservedLabelsByIndex = new Map<number, string>();
  const reservedDirectivesByIndex = new Map<number, ReservedHintDirective>();
  const reservedLabels: string[] = [];
  const claimedIndexes = new Set<number>();

  for (const directive of RESERVED_HINT_DIRECTIVES) {
    const index = preferredIndexes[directive];
    if (index === undefined || claimedIndexes.has(index)) {
      continue;
    }

    const label = getPreferredReservedLabel(reservedHintLabels[directive]);
    if (!label || doesLabelConflictWithReservedLabels(label, reservedLabels)) {
      continue;
    }

    claimedIndexes.add(index);
    reservedLabelsByIndex.set(index, label);
    reservedDirectivesByIndex.set(index, directive);
    reservedLabels.push(label);
  }

  return {
    reservedLabelsByIndex,
    reservedDirectivesByIndex,
    reservedLabels
  };
};