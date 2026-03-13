import {
  getPreferredCancelElementIndex,
  getPreferredDislikeElementIndex,
  getPreferredHomeElementIndex,
  getPreferredLikeElementIndex,
  getPreferredNextElementIndex,
  getPreferredPrevElementIndex,
  getPreferredSearchElementIndex,
  getPreferredSubmitElementIndex,
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
  const preferredNextElementIndex = getPreferredNextElementIndex(elements);
  const preferredPrevElementIndex = getPreferredPrevElementIndex(elements);
  const preferredCancelElementIndex = getPreferredCancelElementIndex(elements);
  const preferredSubmitElementIndex = getPreferredSubmitElementIndex(elements);
  const preferredLikeElementIndex = getPreferredLikeElementIndex(elements);
  const preferredDislikeElementIndex = getPreferredDislikeElementIndex(elements);
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

  if (preferredNextElementIndex !== null) {
    const preferredNextLabel = getPreferredReservedLabel(reservedHintLabels.next);
    if (preferredNextLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredNextElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredNextElementIndex, preferredNextLabel);
        preferredDirectivesByIndex.set(preferredNextElementIndex, "next");
      }
    }
  }

  if (preferredPrevElementIndex !== null) {
    const preferredPrevLabel = getPreferredReservedLabel(reservedHintLabels.prev);
    if (preferredPrevLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredPrevElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredPrevElementIndex, preferredPrevLabel);
        preferredDirectivesByIndex.set(preferredPrevElementIndex, "prev");
      }
    }
  }

  if (preferredCancelElementIndex !== null) {
    const preferredCancelLabel = getPreferredReservedLabel(reservedHintLabels.cancel);
    if (preferredCancelLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredCancelElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredCancelElementIndex, preferredCancelLabel);
        preferredDirectivesByIndex.set(preferredCancelElementIndex, "cancel");
      }
    }
  }

  if (preferredSubmitElementIndex !== null) {
    const preferredSubmitLabel = getPreferredReservedLabel(reservedHintLabels.submit);
    if (preferredSubmitLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredSubmitElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredSubmitElementIndex, preferredSubmitLabel);
        preferredDirectivesByIndex.set(preferredSubmitElementIndex, "submit");
      }
    }
  }

  if (preferredLikeElementIndex !== null) {
    const preferredLikeLabel = getPreferredReservedLabel(reservedHintLabels.like);
    if (preferredLikeLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredLikeElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredLikeElementIndex, preferredLikeLabel);
        preferredDirectivesByIndex.set(preferredLikeElementIndex, "like");
      }
    }
  }

  if (preferredDislikeElementIndex !== null) {
    const preferredDislikeLabel = getPreferredReservedLabel(reservedHintLabels.dislike);
    if (preferredDislikeLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredDislikeElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredDislikeElementIndex, preferredDislikeLabel);
        preferredDirectivesByIndex.set(preferredDislikeElementIndex, "dislike");
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