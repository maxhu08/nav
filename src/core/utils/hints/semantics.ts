import { getPreferredDirectiveIndexes } from "~/src/core/utils/hints/hint-recognition";
import { doesLabelConflictWithReservedLabels } from "~/src/core/utils/hints/labels";
import type { HintDirective } from "~/src/core/utils/hints/directive-recognition/types";
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
  reservedHintLabels: ReservedHintLabels,
  preferredIndexes: Partial<Record<HintDirective, number>> = getPreferredDirectiveIndexes(elements)
): {
  reservedLabelsByIndex: Map<number, string>;
  reservedDirectivesByIndex: Map<number, ReservedHintDirective>;
  reservedLabels: string[];
} => {
  const reservedLabelsByIndex = new Map<number, string>();
  const reservedDirectivesByIndex = new Map<number, ReservedHintDirective>();
  const reservedLabels: string[] = [];
  const claimedIndexes = new Set<number>();
  const directiveOrder: ReservedHintDirective[] = [
    "attach",
    "input",
    ...RESERVED_HINT_DIRECTIVES.filter(
      (directive): directive is Exclude<ReservedHintDirective, "attach" | "input"> =>
        directive !== "attach" && directive !== "input"
    )
  ];

  for (const directive of directiveOrder) {
    const index = preferredIndexes[directive];
    if (index === undefined || claimedIndexes.has(index)) {
      continue;
    }

    claimedIndexes.add(index);
    reservedDirectivesByIndex.set(index, directive);

    const label = getPreferredReservedLabel(reservedHintLabels[directive]);
    if (!label || doesLabelConflictWithReservedLabels(label, reservedLabels)) {
      continue;
    }

    reservedLabelsByIndex.set(index, label);
    reservedLabels.push(label);
  }

  return {
    reservedLabelsByIndex,
    reservedDirectivesByIndex,
    reservedLabels
  };
};