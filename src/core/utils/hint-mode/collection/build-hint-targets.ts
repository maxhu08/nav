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

type DirectiveScorer = (element: HTMLElement) => number;

const HOME_TOKEN_PATTERN = /\bhome(?:page)?\b/i;
const ROOT_PATH_PATTERN = /^\/$/;
const HOME_PATH_PATTERN = /^\/home\/?$/i;
const SIDEBAR_TOKEN_PATTERN =
  /\b(sidebar|side\s*bar|navigation|nav(?:igation)?|drawer|rail|panel)\b/i;
const SIDEBAR_ACTION_PATTERN = /\b(toggle|open|close|collapse|expand|show|hide)\b/i;
const GUIDE_TOKEN_PATTERN = /\bguide\b/i;
const SHELL_CONTEXT_PATTERN = /\b(masthead|topbar|app[-\s]?bar|header|chrome)\b/i;
const INPUT_TOKEN_PATTERN =
  /\b(search|chat|message|prompt|query|reply|ask|compose|composer|write|type|input|textbox|searchbox|editor|command)\b/i;
const CHAT_INPUT_TOKEN_PATTERN =
  /\b(chat|message|prompt|reply|ask|compose|composer|write|editor|command)\b/i;
const ATTACH_TOKEN_PATTERN =
  /\b(attach|upload|paperclip|files?|image|photo|add files?|add attachment|attachments?)\b/i;
const COMPOSER_PLUS_PATTERN = /\bcomposer[-\s]?plus\b/i;
const MICROPHONE_TOKEN_PATTERN = /\b(microphone|mic|voice|audio|record|dictate|speech)\b/i;
const EDITABLE_INPUT_TYPES = new Set([
  "",
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "url"
]);

const getElementTextValues = (element: HTMLElement, attributes: string[]): string[] => {
  return attributes
    .map((attribute) => element.getAttribute(attribute))
    .filter((value): value is string => typeof value === "string" && value.length > 0);
};

const getJoinedElementText = (values: Array<string | null | undefined>): string => {
  return values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .trim();
};

const getAncestorDescriptorText = (element: HTMLElement, depthLimit = 3): string => {
  const values: string[] = [];
  let current = element.parentElement;
  let depth = 0;

  while (current && depth < depthLimit) {
    values.push(current.tagName.toLowerCase(), current.id, current.className);
    current = current.parentElement;
    depth += 1;
  }

  return getJoinedElementText(values);
};

const getPatternScore = (value: string | null, pattern: RegExp, weight: number): number => {
  return typeof value === "string" && pattern.test(value) ? weight : 0;
};

const getTextContentScore = (value: string | null, weight: number): number => {
  return getPatternScore(value, HOME_TOKEN_PATTERN, weight);
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

const isEditableInputCandidate = (element: HTMLElement): boolean => {
  if (element instanceof HTMLTextAreaElement) {
    return !(element.disabled || element.readOnly);
  }

  if (element instanceof HTMLInputElement) {
    return (
      !(element.disabled || element.readOnly) &&
      EDITABLE_INPUT_TYPES.has(element.type.toLowerCase())
    );
  }

  const role = element.getAttribute("role")?.toLowerCase();
  return (
    element.isContentEditable || role === "textbox" || role === "searchbox" || role === "combobox"
  );
};

const scoreInputDirectiveCandidate = (element: HTMLElement): number => {
  if (!isEditableInputCandidate(element)) {
    return 0;
  }

  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "placeholder",
      "aria-placeholder",
      "data-placeholder",
      "name",
      "id",
      "class",
      "role",
      "type"
    ]),
    element.textContent
  ]);
  const placeholderText = getJoinedElementText(
    getElementTextValues(element, [
      "placeholder",
      "aria-placeholder",
      "data-placeholder",
      "aria-label"
    ])
  );

  const semanticScore = Math.max(
    getPatternScore(placeholderText, INPUT_TOKEN_PATTERN, 16),
    getPatternScore(descriptorText, INPUT_TOKEN_PATTERN, 12)
  );
  const chatComposerScore = getPatternScore(descriptorText, CHAT_INPUT_TOKEN_PATTERN, 8);
  const typeScore =
    element instanceof HTMLTextAreaElement
      ? 7
      : element instanceof HTMLInputElement
        ? element.type.toLowerCase() === "search"
          ? 10
          : 4
        : element.isContentEditable
          ? 9
          : 6;

  const parentContext = getJoinedElementText([
    element.closest("form,[role='search'],header,main,aside,nav,section")?.getAttribute("class"),
    element.closest("form,[role='search'],header,main,aside,nav,section")?.getAttribute("id")
  ]);
  const contextScore = INPUT_TOKEN_PATTERN.test(parentContext) ? 4 : 0;

  return semanticScore > 0
    ? semanticScore + chatComposerScore + typeScore + contextScore
    : typeScore >= 7
      ? typeScore
      : 0;
};

const scoreSidebarDirectiveCandidate = (element: HTMLElement): number => {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();
  const buttonLike = role === "button" || tagName === "button" || tagName === "summary";

  if (!buttonLike) {
    return 0;
  }

  const controlTarget = element.getAttribute("aria-controls");
  const controlledElement = controlTarget ? document.getElementById(controlTarget) : null;
  const ancestorDescriptorText = getAncestorDescriptorText(element);
  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "aria-description",
      "data-tooltip",
      "id",
      "class"
    ]),
    element.textContent,
    controlTarget,
    controlledElement?.getAttribute("aria-label"),
    controlledElement?.getAttribute("id"),
    controlledElement?.getAttribute("class"),
    ancestorDescriptorText
  ]);

  if (
    element.getAttribute("aria-haspopup")?.toLowerCase() === "menu" &&
    !SIDEBAR_TOKEN_PATTERN.test(descriptorText)
  ) {
    return 0;
  }

  const sidebarScore = Math.max(
    getPatternScore(descriptorText, SIDEBAR_TOKEN_PATTERN, 14),
    getPatternScore(controlTarget, SIDEBAR_TOKEN_PATTERN, 8)
  );
  const menuScore = /\b(menu|hamburger)\b/i.test(descriptorText) ? 6 : 0;
  const actionScore = SIDEBAR_ACTION_PATTERN.test(descriptorText) ? 6 : 0;
  const guideScore =
    getPatternScore(descriptorText, GUIDE_TOKEN_PATTERN, 10) +
    (SHELL_CONTEXT_PATTERN.test(ancestorDescriptorText) ? 6 : 0);
  const controlScore = controlTarget ? 4 : 0;
  const expandedScore = element.hasAttribute("aria-expanded") ? 3 : 0;
  const positionScore = (() => {
    const rect = element.getBoundingClientRect();
    return rect.top <= 160 && rect.left <= 160 ? 3 : 0;
  })();

  if (sidebarScore === 0 && menuScore === 0 && guideScore === 0) {
    return 0;
  }

  return (
    sidebarScore +
    menuScore +
    guideScore +
    actionScore +
    controlScore +
    expandedScore +
    positionScore
  );
};

const isButtonLikeDirectiveCandidate = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();

  if (tagName === "button" || tagName === "label") {
    return true;
  }

  if (tagName === "input") {
    const type = (element.getAttribute("type") ?? "").toLowerCase();
    return ["button", "submit", "image", "file"].includes(type);
  }

  return role === "button";
};

const scoreAttachDirectiveCandidate = (element: HTMLElement): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "aria-description",
      "data-tooltip",
      "data-testid",
      "id",
      "class",
      "name",
      "type"
    ]),
    element.textContent,
    getAncestorDescriptorText(element)
  ]);
  const fileInputScore =
    element instanceof HTMLInputElement && element.type.toLowerCase() === "file" ? 12 : 0;
  const semanticScore = getPatternScore(descriptorText, ATTACH_TOKEN_PATTERN, 16);
  const composerPlusScore = getPatternScore(descriptorText, COMPOSER_PLUS_PATTERN, 10);

  return semanticScore + composerPlusScore + fileInputScore;
};

const scoreMicrophoneDirectiveCandidate = (element: HTMLElement): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "aria-description",
      "data-tooltip",
      "id",
      "class",
      "name"
    ]),
    element.textContent,
    getAncestorDescriptorText(element)
  ]);

  return getPatternScore(descriptorText, MICROPHONE_TOKEN_PATTERN, 18);
};

const DIRECTIVE_SCORERS: Partial<Record<ReservedHintDirective, DirectiveScorer>> = {
  home: scoreHomeDirectiveCandidate,
  input: scoreInputDirectiveCandidate,
  sidebar: scoreSidebarDirectiveCandidate,
  attach: scoreAttachDirectiveCandidate,
  microphone: scoreMicrophoneDirectiveCandidate
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