import { HINT_DIRECTIVE_ICON_PATHS } from "~/src/lib/hint-directive-icons";
import { HINT_FOCUS_MODE_ICON_PATH } from "~/src/lib/inline-icons";
import { DIRECTIVE_SCORERS } from "~/src/core/utils/hint-mode/directive-recognition";
import type { DirectiveScorer } from "~/src/core/utils/hint-mode/directive-recognition/shared";
import { getClosestLinkUrl } from "~/src/core/utils/hint-mode/collection/get-closest-link-url";
import { getElementImageUrl } from "~/src/core/utils/hint-mode/collection/get-element-image-url";
import { getHintableElements } from "~/src/core/utils/hint-mode/collection/get-hintable-elements";
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
  target.marker = createHintMarkerWithIcon(
    "directive",
    createInlineSvgIcon(HINT_DIRECTIVE_ICON_PATHS[directive])
  );
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
    if (mode === "yank-link-url") {
      return !!getClosestLinkUrl(element);
    }

    if (mode === "yank-image" || mode === "yank-image-url") {
      return !!getElementImageUrl(element);
    }

    return true;
  });

  const directiveMatches = new Map<ReservedHintDirective, DirectiveMatch>();
  const targets = filteredElements.map((element) => {
    const rect = element.getBoundingClientRect();
    const marker = seemsExpandable(element)
      ? createHintMarkerWithIcon("focus-action", createInlineSvgIcon(HINT_FOCUS_MODE_ICON_PATH))
      : createHintMarker();

    const target: HintTarget = {
      element,
      label: "",
      marker,
      rect,
      imageUrl: getElementImageUrl(element),
      linkUrl: getClosestLinkUrl(element)
    };

    for (const [directive, scorer] of Object.entries(DIRECTIVE_SCORERS) as Array<
      [ReservedHintDirective, DirectiveScorer | undefined]
    >) {
      if (!scorer) {
        continue;
      }

      const score = scorer(element);
      const currentMatch = directiveMatches.get(directive);

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
    match.target.label = preferredLabel;
    match.target.directiveMatch = {
      directive,
      label: preferredLabel
    };

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

  for (const target of allTargets) {
    if (target.directiveMatch && target.element.isConnected) {
      applyDirectiveMarker(target, target.directiveMatch.directive, showCapitalizedLetters);
    }
  }

  return allTargets;
};