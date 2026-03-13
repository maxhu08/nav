import {
  getPreferredHomeElementIndex,
  getPreferredSearchElementIndex,
  getPreferredSidebarElementIndex
} from "~/src/core/utils/hints/hint-recognition";
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
  const preferredSearchElementIndex = getPreferredSearchElementIndex(elements);
  const preferredHomeElementIndex = getPreferredHomeElementIndex(elements);
  const preferredSidebarElementIndex = getPreferredSidebarElementIndex(elements);
  const preferredLabelsByIndex = new Map<number, string>();
  const preferredDirectivesByIndex = new Map<number, ReservedHintDirective>();

  if (preferredSearchElementIndex !== null) {
    const preferredSearchLabel = getPreferredReservedLabel(reservedHintLabels.search);
    if (preferredSearchLabel) {
      preferredLabelsByIndex.set(preferredSearchElementIndex, preferredSearchLabel);
      preferredDirectivesByIndex.set(preferredSearchElementIndex, "search");
    }
  }

  if (preferredHomeElementIndex !== null) {
    const preferredHomeLabel = getPreferredReservedLabel(reservedHintLabels.home);
    if (preferredHomeLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredHomeElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredHomeElementIndex, preferredHomeLabel);
        preferredDirectivesByIndex.set(preferredHomeElementIndex, "home");
      }
    }
  }

  if (preferredSidebarElementIndex !== null) {
    const preferredSidebarLabel = getPreferredReservedLabel(reservedHintLabels.sidebar);
    if (preferredSidebarLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredSidebarElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredSidebarElementIndex, preferredSidebarLabel);
        preferredDirectivesByIndex.set(preferredSidebarElementIndex, "sidebar");
      }
    }
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