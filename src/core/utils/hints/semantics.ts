import { getPreferredDirectiveIndexes } from "~/src/core/utils/hints/hint-recognition";
import { doesLabelConflictWithReservedLabels } from "~/src/core/utils/hints/labels";
import type { ReservedHintDirective, ReservedHintLabels } from "~/src/core/utils/hints/types";

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
  const preferredLabelsByIndex = new Map<number, string>();
  const preferredDirectivesByIndex = new Map<number, ReservedHintDirective>();
  const directiveOrder: ReservedHintDirective[] = [
    "search",
    "home",
    "sidebar",
    "next",
    "prev",
    "cancel",
    "submit",
    "like",
    "dislike"
  ];

  for (const directive of directiveOrder) {
    const preferredIndex = preferredIndexes[directive];
    if (preferredIndex === null || preferredIndex === undefined) {
      continue;
    }

    if (preferredLabelsByIndex.has(preferredIndex)) {
      continue;
    }

    const preferredLabel = getPreferredReservedLabel(reservedHintLabels[directive]);
    if (!preferredLabel) {
      continue;
    }

    preferredLabelsByIndex.set(preferredIndex, preferredLabel);
    preferredDirectivesByIndex.set(preferredIndex, directive);
  }

  const reservedLabelsByIndex = new Map<number, string>();
  const reservedDirectivesByIndex = new Map<number, ReservedHintDirective>();
  const reservedLabels: string[] = [];

  for (const [index, label] of preferredLabelsByIndex.entries()) {
    if (doesLabelConflictWithReservedLabels(label, reservedLabels)) {
      continue;
    }

    reservedLabelsByIndex.set(index, label);
    const directive = preferredDirectivesByIndex.get(index);
    if (directive) {
      reservedDirectivesByIndex.set(index, directive);
    }
    reservedLabels.push(label);
  }

  return {
    reservedLabelsByIndex,
    reservedDirectivesByIndex,
    reservedLabels
  };
};