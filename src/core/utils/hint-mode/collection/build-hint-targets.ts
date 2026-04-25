import { HINT_DIRECTIVE_ICON_PATHS } from "~/src/lib/hint-directive-icons";
import {
  EXTERNAL_LINK_ICON_PATH,
  HINT_CURSOR_ICON_PATH,
  HINT_FOCUS_MODE_ICON_PATH,
  HINT_MORE_ICON_PATH,
  WATCH_PLAY_ICON_PATH
} from "~/src/lib/inline-icons";
import { DIRECTIVE_SCORERS } from "~/src/core/utils/hint-mode/directive-recognition";
import type { DirectiveScorer } from "~/src/core/utils/hint-mode/directive-recognition/shared";
import {
  isActionableDirectiveCandidate,
  isEditableInputCandidate,
  getElementTextValues,
  getJoinedElementText,
  isButtonLikeDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";
import { getClosestLinkUrl } from "~/src/core/utils/hint-mode/collection/get-closest-link-url";
import { collectElements } from "~/src/core/utils/hint-mode/collection/collect-elements";
import { getElementImageUrl } from "~/src/core/utils/hint-mode/collection/get-element-image-url";
import { getHintableElements } from "~/src/core/utils/hint-mode/collection/get-hintable-elements";
import { isElementVisible } from "~/src/core/utils/hint-mode/collection/is-element-visible";
import { resolveFollowDirectionTarget } from "~/src/core/utils/follow-page-target";
import { generateHintLabels } from "~/src/core/utils/hint-mode/generation/generate-hint-labels";
import {
  createHintMarker,
  createHintThumbnailMarker,
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
import type { HintCustomSelectorRule } from "~/src/utils/hint-custom-selectors";

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
const SIDE_DIALOG_PATTERN =
  /\b(side[-\s]?nav|sidebar|drawer|navigation menu|global navigation menu)\b/i;
const MORE_ACTION_LABEL_PATTERN =
  /\b(more actions|more options|open (?:item|conversation) options|(?:item|conversation) options|additional actions|overflow)\b/i;
const MORE_ACTION_ICON_PATTERN =
  /\b(ellipsis|kebab|overflow|more[-_\s]?(?:horiz|vert|horizontal|vertical)|three[-_\s]?dots|dots)\b/i;
const MORE_ACTION_TRIGGER_PATTERN = /(?:^|[-_])(options?|menu)(?:$|[-_])/i;

type DirectiveMatch = {
  element: HTMLElement;
  score: number;
  target: HintTarget;
};

type CustomSelectorMatches = {
  autoTargets: Set<HTMLElement>;
  explicitLabels: Map<HTMLElement, string>;
  matchedElements: HTMLElement[];
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

const applyInlineIconMarker = (
  target: HintTarget,
  iconPath: string,
  showCapitalizedLetters: boolean
): void => {
  target.marker = createHintMarkerWithIcon("inline-icon", createInlineSvgIcon(iconPath));
  renderMarkerLabel(target.marker, target.label, 0, showCapitalizedLetters);
};

const applyThumbnailMarker = (
  target: HintTarget,
  showCapitalizedLetters: boolean,
  iconPath = WATCH_PLAY_ICON_PATH
): void => {
  target.marker = createHintThumbnailMarker(createInlineSvgIcon(iconPath));
  renderMarkerLabel(target.marker, target.label, 0, showCapitalizedLetters);
};

const applyThumbnailInlineIconMarker = (
  target: HintTarget,
  showCapitalizedLetters: boolean
): void => {
  target.marker = createHintMarkerWithIcon(
    "inline-icon",
    createInlineSvgIcon(WATCH_PLAY_ICON_PATH)
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

const hasLinkSemantics = (element: HTMLElement): boolean => {
  if (getClosestLinkUrl(element)) {
    return true;
  }

  return false;
};

const MEDIA_THUMBNAIL_SELECTOR = "img, video, image[href], image[xlink\\:href], [role='img']";

const isVisibleMediaElement = (element: Element): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true";
};

const getMediaThumbnailElement = (element: HTMLElement): HTMLElement | null => {
  if (element.matches(MEDIA_THUMBNAIL_SELECTOR) && isVisibleMediaElement(element)) {
    return element;
  }

  for (const candidate of element.querySelectorAll(MEDIA_THUMBNAIL_SELECTOR)) {
    if (isVisibleMediaElement(candidate)) {
      return candidate;
    }
  }

  return null;
};

const isMediaThumbnailTarget = (element: HTMLElement, rect: DOMRect): boolean => {
  if (rect.width < 72 || rect.height < 40) {
    return false;
  }

  if (!(hasLinkSemantics(element) || hasButtonSemantics(element))) {
    return false;
  }

  const mediaElement = getMediaThumbnailElement(element);
  if (!mediaElement) {
    return false;
  }

  const mediaRect = mediaElement.getBoundingClientRect();
  if (mediaRect.width < 64 || mediaRect.height < 36) {
    return false;
  }

  if (mediaRect.width < rect.width * 0.45 || mediaRect.height < rect.height * 0.45) {
    return false;
  }

  const rectArea = Math.max(rect.width * rect.height, 1);
  const mediaArea = mediaRect.width * mediaRect.height;
  return mediaArea >= rectArea * 0.3;
};

const opensPopup = (element: HTMLElement): boolean => {
  const popupType = element.getAttribute("aria-haspopup")?.toLowerCase();
  return typeof popupType === "string" && popupType !== "false";
};

const isMoreActionsTarget = (element: HTMLElement): boolean => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return false;
  }

  const labelText = getJoinedElementText(
    getElementTextValues(element, ["aria-label", "title", "aria-description", "data-tooltip"])
  );

  if (MORE_ACTION_LABEL_PATTERN.test(labelText)) {
    return true;
  }

  if (!opensPopup(element)) {
    return false;
  }

  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "data-testid",
      "data-conversation-options-trigger",
      "id",
      "class",
      "name",
      "icon"
    ]),
    element.textContent
  ]);

  if (MORE_ACTION_ICON_PATTERN.test(descriptorText)) {
    return true;
  }

  if (MORE_ACTION_TRIGGER_PATTERN.test(descriptorText)) {
    return true;
  }

  const textContent = element.textContent?.trim() ?? "";
  return /^(?:\.\.\.|…|⋯)$/.test(textContent);
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

const isNestedSidebarDisclosureButton = (element: HTMLElement): boolean => {
  if (!element.matches("button[data-state='open'], button[data-state='closed']")) {
    return false;
  }

  const sidebarItem = element.closest("a[data-sidebar-item='true']");
  if (!(sidebarItem instanceof HTMLElement)) {
    return false;
  }

  return (
    !!element.querySelector("[data-testid='project-folder-icon']") ||
    !!element.querySelector("svg[aria-label]") ||
    !!sidebarItem.querySelector("[data-testid='project-folder-icon']")
  );
};

const seemsExpandable = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();

  if (isFormControl(element)) {
    return false;
  }

  if (isNestedSidebarDisclosureButton(element)) {
    return true;
  }

  if (hasLinkSemantics(element)) {
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
    isMediaThumbnail: sourceTarget.isMediaThumbnail,
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

  const labelledByText = (() => {
    const labelledBy = element.getAttribute("aria-labelledby")?.trim();
    if (!labelledBy) {
      return "";
    }

    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .filter((value) => value.length > 0)
      .join(" ");
  })();
  const extendedDescriptorText = getJoinedElementText([
    descriptorText,
    labelledByText,
    element.querySelector("[data-testid^='side-nav-menu-item-']") ? "side-nav-menu-item" : ""
  ]);

  if (
    SIDE_DIALOG_PATTERN.test(extendedDescriptorText) &&
    /^(?:left|right)$/i.test(element.getAttribute("data-position-regular") ?? "")
  ) {
    return 0;
  }

  if (isModalSectionCandidate(element)) {
    return 0;
  }

  const hasExplicitModalSemantics =
    element.tagName.toLowerCase() === "dialog" ||
    element.getAttribute("role")?.toLowerCase() === "dialog" ||
    element.getAttribute("aria-modal")?.toLowerCase() === "true";
  const tokenScore = MODAL_TOKEN_PATTERN.test(extendedDescriptorText) ? 12 : 0;
  const semanticsScore = hasExplicitModalSemantics ? 18 : 0;
  const panelScore = getPopupPanelScore(element);
  const sectionPenalty = MODAL_SECTION_PATTERN.test(extendedDescriptorText) ? 10 : 0;
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
    isMediaThumbnail: false,
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

  if (mode === "right-click") {
    return createHintMarkerWithIcon("directive", createInlineSvgIcon(HINT_CURSOR_ICON_PATH));
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

  if (mode === "right-click") {
    return HINT_CURSOR_ICON_PATH;
  }

  if (mode === "yank-link-url" || mode === "yank-image" || mode === "yank-image-url") {
    return HINT_DIRECTIVE_ICON_PATHS.copy;
  }

  return null;
};

const hasBoundDirectiveLabel = (
  directiveLabels: HintDirectiveLabelMap,
  directive: ReservedHintDirective
): boolean => {
  return directiveLabels[directive].some((label) => label.length > 0);
};

const hasScorer = (
  entry: [ReservedHintDirective, DirectiveScorer | undefined]
): entry is [ReservedHintDirective, DirectiveScorer] => {
  return !!entry[1];
};

const shouldScoreDirectiveForElement = (
  directive: ReservedHintDirective,
  element: HTMLElement
): boolean => {
  switch (directive) {
    case "input":
      return isEditableInputCandidate(element);
    case "sidebar":
    case "attach":
    case "microphone":
    case "submit":
    case "like":
    case "dislike":
      return isButtonLikeDirectiveCandidate(element);
    case "chat":
    case "comment":
    case "share":
    case "download":
    case "login":
    case "notification":
    case "delete":
    case "save":
    case "copy":
    case "cancel":
    case "home":
      return isActionableDirectiveCandidate(element);
    default:
      return true;
  }
};

const isElementCompatibleWithMode = (mode: HintActionMode, element: HTMLElement): boolean => {
  if (mode === "new-tab" || mode === "yank-link-url") {
    return !!getClosestLinkUrl(element);
  }

  if (mode === "yank-image" || mode === "yank-image-url") {
    return !!getElementImageUrl(element);
  }

  return true;
};

const getMatchingCustomSelectorTargets = (
  mode: HintActionMode,
  customSelectors: HintCustomSelectorRule[]
): CustomSelectorMatches => {
  const matchedElements: HTMLElement[] = [];
  const seenElements = new Set<HTMLElement>();
  const autoTargets = new Set<HTMLElement>();
  const explicitLabels = new Map<HTMLElement, string>();
  const currentUrl = window.location.href;

  for (const rule of customSelectors) {
    let regex: RegExp;

    try {
      regex = new RegExp(rule.pattern);
    } catch {
      continue;
    }

    if (!regex.test(currentUrl)) {
      continue;
    }

    for (const entry of rule.entries) {
      const elements: HTMLElement[] = [];

      try {
        collectElements(document, entry.selector, elements);
      } catch {
        continue;
      }

      const compatibleElements = elements.filter((element) => {
        return isElementVisible(element) && isElementCompatibleWithMode(mode, element);
      });

      if (entry.key === null) {
        for (const element of compatibleElements) {
          if (!seenElements.has(element)) {
            seenElements.add(element);
            matchedElements.push(element);
          }

          autoTargets.add(element);
        }

        continue;
      }

      const matchedElement = compatibleElements[0];
      if (!matchedElement) {
        continue;
      }

      if (!seenElements.has(matchedElement)) {
        seenElements.add(matchedElement);
        matchedElements.push(matchedElement);
      }

      if (!explicitLabels.has(matchedElement)) {
        explicitLabels.set(matchedElement, entry.key);
      }
    }
  }

  return {
    autoTargets,
    explicitLabels,
    matchedElements
  };
};

export const buildHintTargets = (
  mode: HintActionMode,
  charset: string,
  minLabelLength: number,
  showCapitalizedLetters: boolean,
  directiveLabels: HintDirectiveLabelMap = createEmptyReservedHintLabels(),
  forbiddenLeadingCharacters: string[] = [],
  forbiddenAdjacentPairs: Partial<Record<string, Partial<Record<string, true>>>> = {},
  improveThumbnailMarkers = false,
  customSelectors: HintCustomSelectorRule[] = []
): HintTarget[] => {
  const ignoreDirectives = mode === "right-click";
  const customSelectorMatches = getMatchingCustomSelectorTargets(mode, customSelectors);
  const filteredElements = getHintableElements(mode).filter((element) => {
    return isElementCompatibleWithMode(mode, element);
  });
  const filteredElementSet = new Set(filteredElements);
  const activeDirectiveScorerEntries = ignoreDirectives
    ? []
    : DIRECTIVE_SCORER_ENTRIES.filter(hasScorer).filter(([directive]) => {
        return hasBoundDirectiveLabel(directiveLabels, directive);
      });

  for (const element of customSelectorMatches.matchedElements) {
    if (!filteredElementSet.has(element)) {
      filteredElementSet.add(element);
      filteredElements.push(element);
    }
  }

  const directiveMatches = new Map<ReservedHintDirective, DirectiveMatch>();
  const targetsByElement = new Map<HTMLElement, HintTarget>();
  const targets = filteredElements.map((element) => {
    const rect = element.getBoundingClientRect();
    const marker = createModeMarker(mode, element);
    const isMediaThumbnail = isMediaThumbnailTarget(element, rect);

    const target: HintTarget = {
      element,
      label: "",
      marker,
      rect,
      imageUrl: getElementImageUrl(element),
      linkUrl: getClosestLinkUrl(element),
      isMediaThumbnail
    };

    targetsByElement.set(element, target);

    if (activeDirectiveScorerEntries.length > 0) {
      for (const [directive, scorer] of activeDirectiveScorerEntries) {
        const currentMatch = directiveMatches.get(directive);
        if (currentMatch?.score === MAX_DIRECTIVE_SCORE) {
          continue;
        }

        if (!shouldScoreDirectiveForElement(directive, element)) {
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
    }

    return target;
  });

  const reservedDirectiveLabels = new Set<string>();
  const directiveTargets: HintTarget[] = [];

  if (!ignoreDirectives) {
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
  }

  for (const [element, label] of customSelectorMatches.explicitLabels.entries()) {
    const matchedTarget = targetsByElement.get(element);
    if (!matchedTarget) {
      continue;
    }

    matchedTarget.label = label;
    matchedTarget.directiveMatch = undefined;
    reservedDirectiveLabels.add(label);
  }

  const allTargets = [...targets, ...directiveTargets];
  const generatedTargets = allTargets.filter((target) => target.label.length === 0);
  const prioritizedGeneratedTargets = generatedTargets.sort((left, right) => {
    const leftPriority = customSelectorMatches.autoTargets.has(left.element) ? 0 : 1;
    const rightPriority = customSelectorMatches.autoTargets.has(right.element) ? 0 : 1;
    return leftPriority - rightPriority;
  });

  const generatedLabels = generateAvailableLabels(
    prioritizedGeneratedTargets.length,
    charset,
    minLabelLength,
    forbiddenLeadingCharacters,
    forbiddenAdjacentPairs,
    reservedDirectiveLabels
  );
  let generatedLabelIndex = 0;

  for (const target of prioritizedGeneratedTargets) {
    if (target.label.length === 0) {
      target.label = generatedLabels[generatedLabelIndex] ?? "";
      generatedLabelIndex += 1;
    }
  }

  for (const target of allTargets) {
    renderMarkerLabel(target.marker, target.label, 0, showCapitalizedLetters);
  }

  const forcedDirective = getForcedDirectiveForMode(mode);
  const forcedIcon = getForcedIconForMode(mode);

  for (const target of allTargets) {
    if (target.isMediaThumbnail && target.element.isConnected) {
      if (improveThumbnailMarkers && !target.directiveMatch) {
        applyThumbnailMarker(target, showCapitalizedLetters, forcedIcon ?? WATCH_PLAY_ICON_PATH);
        continue;
      }
    }

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
      continue;
    }

    if (target.isMediaThumbnail && target.element.isConnected) {
      applyThumbnailInlineIconMarker(target, showCapitalizedLetters);
      continue;
    }

    if (target.element.isConnected && isMoreActionsTarget(target.element)) {
      applyInlineIconMarker(target, HINT_MORE_ICON_PATH, showCapitalizedLetters);
    }
  }

  return allTargets;
};