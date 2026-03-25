import {
  getPreferredDirectiveIndexes,
  getSuppressedAttachRelatedHintIndexes,
  getHintableElements
} from "~/src/core/utils/hints/hint-recognition";
import {
  getJoinedAttributeText,
  getSemanticControlText,
  isButtonLikeControl,
  isLikelyShortControlText,
  textMatchesAnyPattern
} from "~/src/core/utils/hints/directive-recognition/shared";
import type { LinkMode } from "~/src/core/utils/hints/model";
import { buildHintLabels } from "~/src/core/utils/hints/labels";
import { assignHintSemantics } from "~/src/core/utils/hints/semantics";
import type {
  HintLabelIcon,
  HintLabelPlanSettings,
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/core/utils/hints/types";

export type HintPipelineTarget = {
  element: HTMLElement;
  label: string;
  directive: ReservedHintDirective | null;
  labelIcon: HintLabelIcon | null;
};

const EXPAND_LABEL_PATTERNS = [/\bexpand\b/i, /\bshow more\b/i];
const COLLAPSE_LABEL_PATTERNS = [/\bcollapse\b/i, /\bshow less\b/i];
const MENU_TRIGGER_LABEL_PATTERNS = [
  /\b(open|show|view|toggle)\b.*\b(options?|actions?|menu)\b/i,
  /\b(options?|actions?)\b.*\b(open|show|view|toggle)\b/i
];
const MORE_LABEL_PATTERNS = [
  /^more$/i,
  /\bmore\b.*\b(options?|actions?)\b/i,
  /\b(options?|actions?)\b.*\bmore\b/i,
  /\bactions?\s+menu\b/i,
  /\bmore\s+menu\b/i,
  /\boverflow\b/i,
  /\bellipsis\b/i
];
const TRAILING_MENU_BUTTON_PATTERNS = [
  /\btrailing\b/i,
  /\bmore\b/i,
  /\boverflow\b/i,
  /\bellipsis\b/i,
  /\bmenu-item-trailing\b/i
];

const COMPOSITE_ROW_SELECTOR = [
  "a[href]",
  "[role='link']",
  "[data-sidebar-item]",
  "[tabindex]:not([tabindex='-1']):not([role='group'])"
].join(", ");

const hasMenuPopupAffordance = (element: HTMLElement): boolean => {
  const hasPopup = (element.getAttribute("aria-haspopup") ?? "").toLowerCase();

  return (
    hasPopup === "menu" ||
    hasPopup === "true" ||
    element.getAttribute("role")?.toLowerCase() === "menuitem"
  );
};

const getExpandedStateIcon = (element: HTMLElement): HintLabelIcon | null => {
  if (!element.hasAttribute("aria-expanded") || hasMenuPopupAffordance(element)) {
    return null;
  }

  return element.getAttribute("aria-expanded") === "true" ? "collapse" : "expand";
};

const getStateToggleIcon = (
  element: HTMLElement,
  semanticControlText: string
): HintLabelIcon | null => {
  if (hasMenuPopupAffordance(element) || !isButtonLikeControl(element)) {
    return null;
  }

  const dataState = (element.getAttribute("data-state") ?? "").toLowerCase();
  if (dataState !== "open" && dataState !== "closed") {
    return null;
  }

  const hasCompositeRowParent =
    element.parentElement?.closest(COMPOSITE_ROW_SELECTOR) instanceof HTMLElement;
  const hasIconOnlyPresentation =
    semanticControlText.length === 0 &&
    element.querySelector("svg, img, [role='img']") instanceof Element;

  if (!hasCompositeRowParent || !hasIconOnlyPresentation) {
    return null;
  }

  return dataState === "open" ? "collapse" : "expand";
};

const getHintLabelIcon = (
  element: HTMLElement,
  directive: ReservedHintDirective | null
): HintLabelIcon | null => {
  if (directive !== null) {
    return null;
  }

  const semanticControlText = getSemanticControlText(element);
  const attributeText = getJoinedAttributeText(
    element,
    [
      "name",
      "id",
      "aria-label",
      "aria-description",
      "data-testid",
      "data-test-id",
      "role",
      "title",
      "class",
      "type",
      "value"
    ],
    [semanticControlText]
  );
  const isCompositeRowDescendant =
    element.parentElement?.closest(COMPOSITE_ROW_SELECTOR) instanceof HTMLElement;
  const hasIconOnlyPresentation =
    semanticControlText.length === 0 &&
    element.querySelector("svg, img, [role='img']") instanceof Element;
  const trailingAttributeText = getJoinedAttributeText(
    element,
    ["data-trailing-button", "class", "id", "data-testid", "data-test-id"],
    []
  );

  if (
    hasMenuPopupAffordance(element) &&
    isCompositeRowDescendant &&
    hasIconOnlyPresentation &&
    (element.hasAttribute("data-trailing-button") ||
      textMatchesAnyPattern(trailingAttributeText, TRAILING_MENU_BUTTON_PATTERNS))
  ) {
    return "more";
  }

  if (
    hasMenuPopupAffordance(element) &&
    textMatchesAnyPattern(attributeText, MENU_TRIGGER_LABEL_PATTERNS)
  ) {
    return "more";
  }

  const canUseExpandCollapseLabelPatterns =
    isButtonLikeControl(element) ||
    element.hasAttribute("aria-expanded") ||
    ((element.getAttribute("data-state") === "open" ||
      element.getAttribute("data-state") === "closed") &&
      element.querySelector("svg, img, [role='img']") instanceof Element);

  if (
    canUseExpandCollapseLabelPatterns &&
    textMatchesAnyPattern(attributeText, COLLAPSE_LABEL_PATTERNS)
  ) {
    return "collapse";
  }

  if (
    canUseExpandCollapseLabelPatterns &&
    textMatchesAnyPattern(attributeText, EXPAND_LABEL_PATTERNS)
  ) {
    return "expand";
  }

  const expandedStateIcon = getExpandedStateIcon(element);
  if (expandedStateIcon) {
    return expandedStateIcon;
  }

  const stateToggleIcon = getStateToggleIcon(element, semanticControlText);
  if (stateToggleIcon) {
    return stateToggleIcon;
  }

  if (
    textMatchesAnyPattern(attributeText, MORE_LABEL_PATTERNS) &&
    (!semanticControlText || isLikelyShortControlText(semanticControlText))
  ) {
    return "more";
  }

  return null;
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
  const preferredDirectiveIndexes = getPreferredDirectiveIndexes(elements);
  const directiveCandidateIndexes = new Set<number>(
    Object.values(preferredDirectiveIndexes).filter(
      (index): index is number => typeof index === "number"
    )
  );
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

    const directive = reservedDirectivesByIndex.get(index) ?? null;

    targets.push({
      element,
      label,
      directive,
      labelIcon: directiveCandidateIndexes.has(index) ? null : getHintLabelIcon(element, directive)
    });
  });

  return targets;
};