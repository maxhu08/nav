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
import {
  buildHintLabels,
  doesLabelConflictWithReservedLabels
} from "~/src/core/utils/hints/labels";
import type { HintPipelineTarget } from "~/src/core/utils/hints/pipeline-types";
import { assignHintSemantics } from "~/src/core/utils/hints/semantics";
import type {
  HintLabelIcon,
  HintLabelPlanSettings,
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/core/utils/hints/types";

const STABLE_FOCUS_HINT_LABEL_ICONS = new Set<HintLabelIcon>(["expand", "collapse"]);

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

const getLabelPatternIcon = (text: string): HintLabelIcon | null => {
  if (textMatchesAnyPattern(text, COLLAPSE_LABEL_PATTERNS)) {
    return "collapse";
  }

  if (textMatchesAnyPattern(text, EXPAND_LABEL_PATTERNS)) {
    return "expand";
  }

  return null;
};

const getAncestorStateToggleIcon = (element: HTMLElement): HintLabelIcon | null => {
  const elementSemanticControlText = getSemanticControlText(element);
  const elementAttributeText = getJoinedAttributeText(
    element,
    ["aria-label", "aria-description", "title", "data-testid", "data-test-id", "class", "id"],
    [elementSemanticControlText]
  );
  let current = element.parentElement;
  let depth = 0;

  while (current && depth < 4) {
    const expandedStateIcon = getExpandedStateIcon(current);
    if (expandedStateIcon) {
      return expandedStateIcon;
    }

    const semanticControlText = getSemanticControlText(current);
    const stateToggleIcon = getStateToggleIcon(current, semanticControlText);
    if (stateToggleIcon) {
      return stateToggleIcon;
    }

    const isRelevantAncestor =
      isButtonLikeControl(current) || current.matches(COMPOSITE_ROW_SELECTOR);

    if (isRelevantAncestor) {
      const attributeText = getJoinedAttributeText(
        current,
        ["aria-label", "aria-description", "title", "data-testid", "data-test-id", "class", "id"],
        [semanticControlText, elementAttributeText]
      );
      const labelPatternIcon = getLabelPatternIcon(attributeText);
      if (labelPatternIcon) {
        return labelPatternIcon;
      }
    }

    if (
      current.matches(COMPOSITE_ROW_SELECTOR) ||
      current instanceof HTMLButtonElement ||
      current.getAttribute("role")?.toLowerCase() === "button"
    ) {
      break;
    }

    depth += 1;
    current = current.parentElement;
  }

  return null;
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

  if (canUseExpandCollapseLabelPatterns) {
    const labelPatternIcon = getLabelPatternIcon(attributeText);
    if (labelPatternIcon) {
      return labelPatternIcon;
    }
  }

  const expandedStateIcon = getExpandedStateIcon(element);
  if (expandedStateIcon) {
    return expandedStateIcon;
  }

  const stateToggleIcon = getStateToggleIcon(element, semanticControlText);
  if (stateToggleIcon) {
    return stateToggleIcon;
  }

  const ancestorStateToggleIcon = getAncestorStateToggleIcon(element);
  if (ancestorStateToggleIcon) {
    return ancestorStateToggleIcon;
  }

  if (
    textMatchesAnyPattern(attributeText, MORE_LABEL_PATTERNS) &&
    (!semanticControlText || isLikelyShortControlText(semanticControlText))
  ) {
    return "more";
  }

  return null;
};

const normalizeStableFocusHintText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.slice(0, 80);
};

const getStableFocusHintElementToken = (
  element: HTMLElement,
  options: { includeFallbackText?: boolean } = {}
): string | null => {
  const attributeCandidates: Array<[string, string | null]> = [
    ["id", element.id || null],
    ["controls", element.getAttribute("aria-controls")],
    ["testid", element.getAttribute("data-testid")],
    ["testid", element.getAttribute("data-test-id")],
    ["name", element.getAttribute("name")]
  ];

  if (options.includeFallbackText) {
    attributeCandidates.push(
      ["label", element.getAttribute("aria-label")],
      ["title", element.getAttribute("title")],
      ["text", element.textContent]
    );
  }

  for (const [prefix, candidate] of attributeCandidates) {
    const normalizedCandidate = normalizeStableFocusHintText(candidate);
    if (normalizedCandidate) {
      return `${prefix}:${normalizedCandidate}`;
    }
  }

  return null;
};

const getStableFocusHintPathSegment = (element: HTMLElement): string => {
  const parent = element.parentElement;
  if (!parent) {
    return `${element.tagName.toLowerCase()}:0`;
  }

  let siblingIndex = 0;

  for (const sibling of parent.children) {
    if (!(sibling instanceof HTMLElement)) {
      continue;
    }

    if (sibling === element) {
      return `${element.tagName.toLowerCase()}:${siblingIndex}`;
    }

    if (sibling.tagName === element.tagName) {
      siblingIndex += 1;
    }
  }

  return `${element.tagName.toLowerCase()}:${siblingIndex}`;
};

const getStableFocusHintSiblingIndex = (element: HTMLElement): number => {
  const parent = element.parentElement;
  if (!parent) {
    return 0;
  }

  let siblingIndex = 0;

  for (const sibling of parent.children) {
    if (!(sibling instanceof HTMLElement)) {
      continue;
    }

    if (sibling === element) {
      return siblingIndex;
    }

    if (sibling.tagName === element.tagName) {
      siblingIndex += 1;
    }
  }

  return siblingIndex;
};

const getStableFocusHintIdentity = (
  element: HTMLElement,
  labelIcon: HintLabelIcon | null
): string | null => {
  if (labelIcon === null || !STABLE_FOCUS_HINT_LABEL_ICONS.has(labelIcon)) {
    return null;
  }

  const tokens = ["kind:focus-toggle"];
  const ownToken = getStableFocusHintElementToken(element);
  if (ownToken) {
    tokens.push(`self:${ownToken}`);
  }
  tokens.push(`self-path:${getStableFocusHintPathSegment(element)}`);

  let current = element.parentElement;
  let depth = 0;

  while (current && depth < 4) {
    const ancestorToken = getStableFocusHintElementToken(current, {
      includeFallbackText: depth > 0
    });
    if (ancestorToken) {
      tokens.push(`ancestor${depth}:${ancestorToken}`);
    }

    tokens.push(`ancestor${depth}-path:${getStableFocusHintPathSegment(current)}`);

    current = current.parentElement;
    depth += 1;
  }

  tokens.push(`tag:${element.tagName.toLowerCase()}`);
  tokens.push(`sibling:${getStableFocusHintSiblingIndex(element)}`);

  return tokens.join("|");
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

const getPreferredReservedDirectiveLabel = (
  reservedHintLabels: ReservedHintLabels,
  directive: ReservedHintDirective,
  claimedLabels: string[]
): string | null => {
  const label = reservedHintLabels[directive].find(
    (candidate) =>
      /^[a-z]+$/.test(candidate) && !doesLabelConflictWithReservedLabels(candidate, claimedLabels)
  );

  return label ?? null;
};

export const assignHintLabels = (
  elements: HTMLElement[],
  reservedHintLabels: ReservedHintLabels,
  labelSettings: HintLabelPlanSettings,
  stableFocusHintLabels: Map<string, string> | null = null
): HintPipelineTarget[] => {
  const preferredDirectiveIndexes = getPreferredDirectiveIndexes(elements);
  const duplicateDirectiveTargets: Array<{ index: number; directive: ReservedHintDirective }> = [];

  if (
    typeof preferredDirectiveIndexes.input === "number" &&
    preferredDirectiveIndexes.erase === preferredDirectiveIndexes.input
  ) {
    duplicateDirectiveTargets.push({
      index: preferredDirectiveIndexes.input,
      directive: "erase"
    });
  }

  const directiveCandidateIndexes = new Set<number>(
    Object.values(preferredDirectiveIndexes).filter(
      (index): index is number => typeof index === "number"
    )
  );
  const { reservedLabelsByIndex, reservedDirectivesByIndex, reservedLabels } = assignHintSemantics(
    elements,
    reservedHintLabels,
    preferredDirectiveIndexes
  );
  const suppressedIndexes = getSuppressedHintIndexes(elements, reservedDirectivesByIndex);
  const focusHintIconsByIndex = new Map<number, HintLabelIcon>();
  const stableFocusHintLabelsByIndex = new Map<number, string>();
  const duplicateReservedLabels = duplicateDirectiveTargets
    .map(({ directive }) =>
      getPreferredReservedDirectiveLabel(reservedHintLabels, directive, reservedLabels)
    )
    .filter((label): label is string => label !== null);
  const stableClaimedLabels = [...reservedLabels, ...duplicateReservedLabels];

  elements.forEach((element, index) => {
    if (suppressedIndexes.has(index)) {
      return;
    }

    const directive = reservedDirectivesByIndex.get(index) ?? null;
    const labelIcon = directive === null ? getHintLabelIcon(element, directive) : null;

    if (labelIcon !== null) {
      focusHintIconsByIndex.set(index, labelIcon);
    }

    if (!stableFocusHintLabels || directive !== null) {
      return;
    }

    const identity = getStableFocusHintIdentity(element, labelIcon);
    const cachedLabel = identity ? stableFocusHintLabels.get(identity) : undefined;
    if (!cachedLabel || !/^[a-z]+$/.test(cachedLabel)) {
      return;
    }

    if (doesLabelConflictWithReservedLabels(cachedLabel, stableClaimedLabels)) {
      return;
    }

    stableClaimedLabels.push(cachedLabel);
    stableFocusHintLabelsByIndex.set(index, cachedLabel);
  });

  const visibleCount = elements.length - suppressedIndexes.size + duplicateDirectiveTargets.length;
  const { labels } = buildHintLabels(visibleCount, [...stableClaimedLabels], labelSettings);

  const targets: HintPipelineTarget[] = [];
  let labelIndex = 0;

  elements.forEach((element, index) => {
    if (suppressedIndexes.has(index)) {
      return;
    }

    const label =
      reservedLabelsByIndex.get(index) ??
      stableFocusHintLabelsByIndex.get(index) ??
      labels[labelIndex++];

    if (!label) {
      return;
    }

    const directive = reservedDirectivesByIndex.get(index) ?? null;
    const labelIcon = directiveCandidateIndexes.has(index)
      ? null
      : (focusHintIconsByIndex.get(index) ?? getHintLabelIcon(element, directive));

    if (stableFocusHintLabels && directive === null) {
      const identity = getStableFocusHintIdentity(element, labelIcon);
      if (identity) {
        stableFocusHintLabels.set(identity, label);
      }
    }

    targets.push({
      element,
      label,
      directive,
      labelIcon
    });
  });

  for (const duplicateTarget of duplicateDirectiveTargets) {
    if (suppressedIndexes.has(duplicateTarget.index)) {
      continue;
    }

    const element = elements[duplicateTarget.index];
    if (!element) {
      continue;
    }

    const label =
      getPreferredReservedDirectiveLabel(
        reservedHintLabels,
        duplicateTarget.directive,
        reservedLabels
      ) ?? labels[labelIndex++];

    if (!label) {
      continue;
    }

    targets.push({
      element,
      label,
      directive: duplicateTarget.directive,
      labelIcon: null
    });
  }

  return targets;
};