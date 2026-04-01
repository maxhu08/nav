import { HINT_DIRECTIVE_ICON_PATHS } from "~/src/lib/hint-directive-icons";
import { HINT_FOCUS_MODE_ICON_PATH } from "~/src/lib/inline-icons";
import { getClosestLinkUrl } from "~/src/core/utils/hint-mode/collection/get-closest-link-url";
import { getElementImageUrl } from "~/src/core/utils/hint-mode/collection/get-element-image-url";
import { getHintableElements } from "~/src/core/utils/hint-mode/collection/get-hintable-elements";
import { generateHintLabels } from "~/src/core/utils/hint-mode/generation/generate-hint-labels";
import {
  createHintMarker,
  createHintMarkerWithIcon
} from "~/src/core/utils/hint-mode/rendering/create-marker-element";
import { renderMarkerLabel } from "~/src/core/utils/hint-mode/rendering/render-marker-label";
import type { HintActionMode, HintTarget } from "~/src/core/utils/hint-mode/shared/types";
import type { ReservedHintDirective } from "~/src/utils/hint-reserved-label-directives";

const createInlineSvgIcon = (pathData: string): string => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${pathData}"></path></svg>`;
};

type DirectiveMatch = {
  element: HTMLElement;
  score: number;
  target: HintTarget;
};

type DirectiveScorer = (element: HTMLElement) => number;

const HOME_TOKEN_PATTERN = /\bhome(?:page)?\b/i;
const ROOT_PATH_PATTERN = /^\/$/;
const HOME_PATH_PATTERN = /^\/home\/?$/i;

const getTextContentScore = (value: string | null, weight: number): number => {
  return typeof value === "string" && HOME_TOKEN_PATTERN.test(value) ? weight : 0;
};

const getHomeLinkScore = (element: HTMLElement): number => {
  if (!(element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement)) {
    return 0;
  }

  try {
    const url = new URL(element.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return 0;
    }

    if (ROOT_PATH_PATTERN.test(url.pathname)) {
      return 8;
    }

    if (HOME_PATH_PATTERN.test(url.pathname)) {
      return 6;
    }
  } catch {
    return 0;
  }

  return 0;
};

const scoreHomeDirectiveCandidate = (element: HTMLElement): number => {
  const homeLabelScore = Math.max(
    getTextContentScore(element.getAttribute("aria-label"), 12),
    getTextContentScore(element.getAttribute("title"), 10),
    getTextContentScore(element.getAttribute("aria-description"), 8),
    getTextContentScore(element.getAttribute("data-tooltip"), 8),
    getTextContentScore(element.getAttribute("alt"), 8),
    getTextContentScore(element.textContent, 9)
  );
  const homeIdentityScore = Math.max(
    getTextContentScore(element.id, 4),
    getTextContentScore(element.className, 3)
  );

  return homeLabelScore + homeIdentityScore + getHomeLinkScore(element);
};

const DIRECTIVE_SCORERS: Partial<Record<ReservedHintDirective, DirectiveScorer>> = {
  home: scoreHomeDirectiveCandidate
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

export const buildHintTargets = (
  mode: HintActionMode,
  charset: string,
  minLabelLength: number,
  showCapitalizedLetters: boolean,
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

  const labels = generateHintLabels(
    filteredElements.length,
    charset,
    minLabelLength,
    forbiddenLeadingCharacters,
    forbiddenAdjacentPairs
  );

  const directiveMatches = new Map<ReservedHintDirective, DirectiveMatch>();
  const targets = filteredElements.map((element, index) => {
    const rect = element.getBoundingClientRect();
    const marker = seemsExpandable(element)
      ? createHintMarkerWithIcon("focus-action", createInlineSvgIcon(HINT_FOCUS_MODE_ICON_PATH))
      : createHintMarker();

    const target: HintTarget = {
      element,
      label: labels[index] ?? "",
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

    renderMarkerLabel(marker, target.label, 0, showCapitalizedLetters);
    return target;
  });

  for (const [directive, match] of directiveMatches.entries()) {
    if (match.element.isConnected) {
      applyDirectiveMarker(match.target, directive, showCapitalizedLetters);
    }
  }

  return targets;
};