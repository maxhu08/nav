import { HINT_DIRECTIVE_ICON_PATHS } from "~/src/lib/hint-directive-icons";
import { EXTERNAL_LINK_ICON_PATH, HINT_FOCUS_MODE_ICON_PATH } from "~/src/lib/inline-icons";
import { DIRECTIVE_SCORERS } from "~/src/core/utils/hint-mode/directive-recognition";
import type { DirectiveScorer } from "~/src/core/utils/hint-mode/directive-recognition/shared";
import { getClosestLinkUrl } from "~/src/core/utils/hint-mode/collection/get-closest-link-url";
import { getElementImageUrl } from "~/src/core/utils/hint-mode/collection/get-element-image-url";
import { getHintableElements } from "~/src/core/utils/hint-mode/collection/get-hintable-elements";
import { resolveFollowDirectionTarget } from "~/src/core/utils/follow-page-target";
import { generateHintLabels } from "~/src/core/utils/hint-mode/generation/generate-hint-labels";
import {
  createHintMarker,
  createHintMarkerWithIcon
} from "~/src/core/utils/hint-mode/rendering/create-marker-element";
import { renderMarkerLabel } from "~/src/core/utils/hint-mode/rendering/render-marker-label";
import type {
  HintActionMode,
  HintDirectiveLabelMap,
  HintTarget
} from "~/src/core/utils/hint-mode/shared/types";
import {
  createEmptyReservedHintLabels,
  type ReservedHintDirective
} from "~/src/utils/hint-reserved-label-directives";

const createInlineSvgIcon = (pathData: string): string => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${pathData}"></path></svg>`;
};

const DIRECTIVE_SCORER_ENTRIES = Object.entries(DIRECTIVE_SCORERS) as Array<
  [ReservedHintDirective, DirectiveScorer | undefined]
>;

const DIRECTIVE_ICON_SVGS = Object.fromEntries(
  Object.entries(HINT_DIRECTIVE_ICON_PATHS).map(([directive, pathData]) => [
    directive,
    createInlineSvgIcon(pathData)
  ])
) as Record<ReservedHintDirective, string>;
const MAX_DIRECTIVE_SCORE = 9999;
const MODAL_CANDIDATE_SELECTOR = [
  "dialog",
  "[role='dialog']",
  "[aria-modal='true']",
  "[data-modal]",
  "[data-dialog]",
  "[class*='modal']",
  "[class*='popup']",
  "[class*='popover']",
  "[class*='lightbox']",
  "[id*='modal']",
  "[id*='popup']"
].join(",");
const MODAL_TOKEN_PATTERN = /\b(dialog|modal|popup|popover|sheet|overlay|lightbox)\b/i;
const NON_MODAL_CONTAINER_PATTERN = /\b(sidebar|drawer|slideover|tooltip|toast|dropdown|menu)\b/i;
const MODAL_SECTION_PATTERN =
  /(?:^|[-_])(popup|modal|dialog|popover|lightbox)[-_](wrapper|body|content|header|footer)(?:$|[-_])/i;

type DirectiveMatch = {
  element: HTMLElement;
  score: number;
  target: HintTarget;
};

const applyDirectiveMarker = (
  target: HintTarget,
  directive: ReservedHintDirective,
  showCapitalizedLetters: boolean
): void => {
  target.marker = createHintMarkerWithIcon("directive", DIRECTIVE_ICON_SVGS[directive]);
  renderMarkerLabel(target.marker, target.label, 0, showCapitalizedLetters);
};

const applyForcedIconMarker = (
  target: HintTarget,
  iconPath: string,
  showCapitalizedLetters: boolean
): void => {
  target.marker = createHintMarkerWithIcon("directive", createInlineSvgIcon(iconPath));
  renderMarkerLabel(target.marker, target.label, 0, showCapitalizedLetters);
};

const isFormControl = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea" ||
    element.isContentEditable
  );
};

const elementTextHintsExpandCollapse = (element: HTMLElement): boolean => {
  const values = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("aria-description"),
    element.getAttribute("data-tooltip"),
    element.id,
    element.className
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  return /\b(expand|collapse|collapsible|accordion|disclosure|toggle section|show more|show less)\b/.test(
    values
  );
};

const elementTextExplicitlyTogglesVisibility = (element: HTMLElement): boolean => {
  const values = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.textContent,
    element.id,
    element.className
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  return /\b(show more|show less|expand|collapse|see more|see less|view more|view less)\b/.test(
    values
  );
};

const hasButtonSemantics = (element: HTMLElement): boolean => {
  const role = element.getAttribute("role")?.toLowerCase();
  return role === "button" || element.tagName.toLowerCase() === "button";
};

const opensPopup = (element: HTMLElement): boolean => {
  const popupType = element.getAttribute("aria-haspopup")?.toLowerCase();
  return typeof popupType === "string" && popupType !== "false";
};

const hasDisclosureState = (element: HTMLElement): boolean => {
  const state = element.getAttribute("data-state")?.toLowerCase();
  return state === "open" || state === "closed";
};

const hasExplicitDisclosureLabel = (element: HTMLElement): boolean => {
  const values = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.textContent
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  if (!values) {
    return false;
  }

  return /\b(expand|collapse|toggle|show more|show less|open section|close section|disclosure)\b/.test(
    values
  );
};

const hasExplicitNonDisclosureLabel = (element: HTMLElement): boolean => {
  const values = [element.getAttribute("aria-label"), element.getAttribute("title")]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .trim();

  return values.length > 0 && !hasExplicitDisclosureLabel(element);
};

const hasExpandCollapseIndicator = (element: HTMLElement): boolean => {
  const values = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("icon"),
    element.id,
    element.className
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  return /\b(arrow|chevron|caret|expand|collapse)\b/.test(values);
};

const getExpandableAncestor = (element: HTMLElement): HTMLElement | null => {
  let current = element.parentElement;

  for (let depth = 0; depth < 4 && current; depth += 1) {
    const values = [current.id, current.className]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join(" ")
      .toLowerCase();

    if (/\b(collapsible|accordion|disclosure|expand|collapse)\b/.test(values)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

const seemsExpandable = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();

  if (isFormControl(element)) {
    return false;
  }

  if (tagName === "details" || tagName === "summary") {
    return true;
  }

  if (opensPopup(element)) {
    return false;
  }

  if (
    hasButtonSemantics(element) &&
    hasDisclosureState(element) &&
    !hasExplicitNonDisclosureLabel(element)
  ) {
    return true;
  }

  if (element.hasAttribute("aria-expanded")) {
    return true;
  }

  if (element.hasAttribute("aria-controls") && element.getAttribute("role") !== "textbox") {
    return elementTextHintsExpandCollapse(element) || hasExpandCollapseIndicator(element);
  }

  if (elementTextExplicitlyTogglesVisibility(element)) {
    return true;
  }

  if (elementTextHintsExpandCollapse(element) && hasExpandCollapseIndicator(element)) {
    return true;
  }

  const expandableContainer = getExpandableAncestor(element);

  if (
    expandableContainer instanceof HTMLElement &&
    hasExpandCollapseIndicator(element) &&
    (hasButtonSemantics(element) ||
      hasButtonSemantics(expandableContainer) ||
      elementTextExplicitlyTogglesVisibility(element))
  ) {
    return true;
  }

  return false;
};

const generateAvailableLabels = (
  count: number,
  charset: string,
  minLabelLength: number,
  forbiddenLeadingCharacters: string[],
  forbiddenAdjacentPairs: Partial<Record<string, Partial<Record<string, true>>>>,
  reservedLabels: Set<string>
): string[] => {
  if (count <= 0) {
    return [];
  }

  let targetCount = count + reservedLabels.size;

  while (true) {
    const labels = generateHintLabels(
      targetCount,
      charset,
      minLabelLength,
      forbiddenLeadingCharacters,
      forbiddenAdjacentPairs
    ).filter((label) => !reservedLabels.has(label));

    if (labels.length >= count) {
      return labels.slice(0, count);
    }

    targetCount += Math.max(count, reservedLabels.size, 1);
  }
};

const createDirectiveTarget = (
  sourceTarget: HintTarget,
  directive: ReservedHintDirective,
  label: string
): HintTarget => {
  return {
    element: sourceTarget.element,
    label,
    marker: createHintMarker(),
    rect: sourceTarget.rect,
    imageUrl: sourceTarget.imageUrl,
    linkUrl: sourceTarget.linkUrl,
    directiveMatch: {
      directive,
      label
    }
  };
};

const getModalDescriptorText = (element: HTMLElement): string => {
  return [
    element.tagName,
    element.getAttribute("role"),
    element.getAttribute("aria-modal"),
    element.getAttribute("aria-label"),
    element.getAttribute("data-testid"),
    element.id,
    element.className
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .trim();
};

const getElementClassTokens = (element: HTMLElement): string[] => {
  return element.className
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);
};

const getPopupPanelScore = (element: HTMLElement): number => {
  let score = 0;

  for (const token of getElementClassTokens(element)) {
    if (
      /(?:^|[-_])(popup|modal|dialog|popover|lightbox)[-_](wrapper|body|content|header|footer)(?:$|[-_])/.test(
        token
      )
    ) {
      score -= 20;
      continue;
    }

    if (/^(?:.+-)?(?:popup|modal|dialog|popover|lightbox)$/.test(token)) {
      score += 12;
      continue;
    }

    if (/(?:^|[-_])(?:popup|modal|dialog|popover|lightbox)(?:$|[-_])/.test(token)) {
      score += 4;
    }
  }

  return score;
};

const isModalSectionCandidate = (element: HTMLElement): boolean => {
  return getElementClassTokens(element).some((token) => {
    return /(?:^|[-_])(popup|modal|dialog|popover|lightbox)[-_](wrapper|body|content|header|footer)(?:$|[-_])/.test(
      token
    );
  });
};

const getModalCandidateScore = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  if (rect.width < 120 || rect.height < 80) {
    return 0;
  }

  const descriptorText = getModalDescriptorText(element);
  if (NON_MODAL_CONTAINER_PATTERN.test(descriptorText)) {
    return 0;
  }

  if (isModalSectionCandidate(element)) {
    return 0;
  }

  const hasExplicitModalSemantics =
    element.tagName.toLowerCase() === "dialog" ||
    element.getAttribute("role")?.toLowerCase() === "dialog" ||
    element.getAttribute("aria-modal")?.toLowerCase() === "true";
  const tokenScore = MODAL_TOKEN_PATTERN.test(descriptorText) ? 12 : 0;
  const semanticsScore = hasExplicitModalSemantics ? 18 : 0;
  const panelScore = getPopupPanelScore(element);
  const sectionPenalty = MODAL_SECTION_PATTERN.test(descriptorText) ? 10 : 0;
  const viewportScore = rect.width >= window.innerWidth * 0.2 && rect.height >= 120 ? 4 : 0;

  return Math.max(semanticsScore + tokenScore + panelScore + viewportScore - sectionPenalty, 0);
};

const getElementDepth = (element: HTMLElement): number => {
  let depth = 0;
  let current = element.parentElement;

  while (current) {
    depth += 1;
    current = current.parentElement;
  }

  return depth;
};

const resolveHideDirectiveTarget = (label: string): HintTarget | null => {
  const modalCandidates = Array.from(
    document.querySelectorAll<HTMLElement>(MODAL_CANDIDATE_SELECTOR)
  );
  let matchedElement: HTMLElement | null = null;
  let matchedScore = 0;

  for (const candidate of modalCandidates) {
    const score = getModalCandidateScore(candidate);
    if (score === 0) {
      continue;
    }

    if (!matchedElement) {
      matchedElement = candidate;
      matchedScore = score;
      continue;
    }

    if (score > matchedScore) {
      matchedElement = candidate;
      matchedScore = score;
      continue;
    }

    if (score === matchedScore) {
      const candidateRect = candidate.getBoundingClientRect();
      const matchedRect = matchedElement.getBoundingClientRect();
      const candidateArea = candidateRect.width * candidateRect.height;
      const matchedArea = matchedRect.width * matchedRect.height;
      const candidateDepth = getElementDepth(candidate);
      const matchedDepth = getElementDepth(matchedElement);

      if (
        candidateArea < matchedArea ||
        (candidateArea === matchedArea && candidateDepth > matchedDepth)
      ) {
        matchedElement = candidate;
      }
    }
  }

  if (!matchedElement || matchedScore === 0) {
    return null;
  }

  const modalRect = matchedElement.getBoundingClientRect();
  const anchorRect = new DOMRect(
    Math.max(modalRect.left, modalRect.right - 8),
    modalRect.top + 8,
    1,
    1
  );

  return {
    element: matchedElement,
    label,
    marker: createHintMarker(),
    rect: anchorRect,
    imageUrl: null,
    linkUrl: null,
    directiveMatch: {
      directive: "hide",
      label
    }
  };
};

const assignDirectiveLabel = (
  target: HintTarget,
  directive: ReservedHintDirective,
  label: string,
  directiveTargets: HintTarget[]
): HintTarget => {
  const directiveTarget =
    target.directiveMatch && target.directiveMatch.directive !== directive
      ? createDirectiveTarget(target, directive, label)
      : target;

  directiveTarget.label = label;
  directiveTarget.directiveMatch = {
    directive,
    label
  };

  if (directiveTarget !== target) {
    directiveTargets.push(directiveTarget);
  }

  return directiveTarget;
};

const createModeMarker = (mode: HintActionMode, element: HTMLElement): HTMLDivElement => {
  if (mode === "new-tab") {
    return createHintMarkerWithIcon("directive", createInlineSvgIcon(EXTERNAL_LINK_ICON_PATH));
  }

  if (mode === "yank-link-url" || mode === "yank-image" || mode === "yank-image-url") {
    return createHintMarkerWithIcon("directive", DIRECTIVE_ICON_SVGS.copy);
  }

  if (seemsExpandable(element)) {
    return createHintMarkerWithIcon("focus-action", createInlineSvgIcon(HINT_FOCUS_MODE_ICON_PATH));
  }

  return createHintMarker();
};

const getForcedDirectiveForMode = (mode: HintActionMode): ReservedHintDirective | null => {
  if (mode === "yank-link-url" || mode === "yank-image" || mode === "yank-image-url") {
    return "copy";
  }

  return null;
};

const getForcedIconForMode = (mode: HintActionMode): string | null => {
  if (mode === "new-tab") {
    return EXTERNAL_LINK_ICON_PATH;
  }

  if (mode === "yank-link-url" || mode === "yank-image" || mode === "yank-image-url") {
    return HINT_DIRECTIVE_ICON_PATHS.copy;
  }

  return null;
};

export const buildHintTargets = (
  mode: HintActionMode,
  charset: string,
  minLabelLength: number,
  showCapitalizedLetters: boolean,
  directiveLabels: HintDirectiveLabelMap = createEmptyReservedHintLabels(),
  forbiddenLeadingCharacters: string[] = [],
  forbiddenAdjacentPairs: Partial<Record<string, Partial<Record<string, true>>>> = {}
): HintTarget[] => {
  const elements = getHintableElements(mode);
  const filteredElements = elements.filter((element) => {
    if (mode === "new-tab") {
      return !!getClosestLinkUrl(element);
    }

    if (mode === "yank-link-url") {
      return !!getClosestLinkUrl(element);
    }

    if (mode === "yank-image" || mode === "yank-image-url") {
      return !!getElementImageUrl(element);
    }

    return true;
  });

  const directiveMatches = new Map<ReservedHintDirective, DirectiveMatch>();
  const targetsByElement = new Map<HTMLElement, HintTarget>();
  const targets = filteredElements.map((element) => {
    const rect = element.getBoundingClientRect();
    const marker = createModeMarker(mode, element);

    const target: HintTarget = {
      element,
      label: "",
      marker,
      rect,
      imageUrl: getElementImageUrl(element),
      linkUrl: getClosestLinkUrl(element)
    };

    targetsByElement.set(element, target);

    for (const [directive, scorer] of DIRECTIVE_SCORER_ENTRIES) {
      if (!scorer) {
        continue;
      }

      const currentMatch = directiveMatches.get(directive);
      if (currentMatch?.score === MAX_DIRECTIVE_SCORE) {
        continue;
      }

      const score = scorer(element);

      if (score > 0 && (!currentMatch || score > currentMatch.score)) {
        directiveMatches.set(directive, {
          element,
          score,
          target
        });
      }
    }

    return target;
  });

  const reservedDirectiveLabels = new Set<string>();
  const directiveTargets: HintTarget[] = [];

  for (const [directive, match] of directiveMatches.entries()) {
    const preferredLabel = directiveLabels[directive].find(
      (label) => label.length > 0 && !reservedDirectiveLabels.has(label)
    );

    if (!preferredLabel) {
      continue;
    }

    reservedDirectiveLabels.add(preferredLabel);
    assignDirectiveLabel(match.target, directive, preferredLabel, directiveTargets);

    if (directive === "input") {
      const eraseLabel = directiveLabels.erase.find(
        (label) => label.length > 0 && !reservedDirectiveLabels.has(label)
      );

      if (eraseLabel) {
        reservedDirectiveLabels.add(eraseLabel);
        directiveTargets.push(createDirectiveTarget(match.target, "erase", eraseLabel));
      }
    }
  }

  for (const directive of ["prev", "next"] as const) {
    const preferredLabel = directiveLabels[directive].find(
      (label) => label.length > 0 && !reservedDirectiveLabels.has(label)
    );

    if (!preferredLabel) {
      continue;
    }

    const matchedElement = resolveFollowDirectionTarget(directive === "prev" ? "prev" : "next");
    if (!(matchedElement instanceof HTMLElement)) {
      continue;
    }

    const matchedTarget = targetsByElement.get(matchedElement);
    if (!matchedTarget || matchedTarget.directiveMatch) {
      continue;
    }

    reservedDirectiveLabels.add(preferredLabel);
    assignDirectiveLabel(matchedTarget, directive, preferredLabel, directiveTargets);
  }

  const hideLabel = directiveLabels.hide.find(
    (label) => label.length > 0 && !reservedDirectiveLabels.has(label)
  );

  if (hideLabel) {
    const hideTarget = resolveHideDirectiveTarget(hideLabel);
    if (hideTarget) {
      reservedDirectiveLabels.add(hideLabel);
      directiveTargets.push(hideTarget);
    }
  }

  const allTargets = [...targets, ...directiveTargets];

  const generatedLabels = generateAvailableLabels(
    allTargets.filter((target) => !target.directiveMatch).length,
    charset,
    minLabelLength,
    forbiddenLeadingCharacters,
    forbiddenAdjacentPairs,
    reservedDirectiveLabels
  );
  let generatedLabelIndex = 0;

  for (const target of allTargets) {
    if (!target.directiveMatch) {
      target.label = generatedLabels[generatedLabelIndex] ?? "";
      generatedLabelIndex += 1;
    }

    renderMarkerLabel(target.marker, target.label, 0, showCapitalizedLetters);
  }

  const forcedDirective = getForcedDirectiveForMode(mode);
  const forcedIcon = getForcedIconForMode(mode);

  for (const target of allTargets) {
    if (forcedIcon && target.element.isConnected) {
      applyForcedIconMarker(target, forcedIcon, showCapitalizedLetters);
      continue;
    }

    if (forcedDirective && target.element.isConnected) {
      applyDirectiveMarker(target, forcedDirective, showCapitalizedLetters);
      continue;
    }

    if (target.directiveMatch && target.element.isConnected) {
      applyDirectiveMarker(target, target.directiveMatch.directive, showCapitalizedLetters);
    }
  }

  return allTargets;
};