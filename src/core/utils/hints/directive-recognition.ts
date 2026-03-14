import { getDeepActiveElement, isSelectableElement } from "~/src/core/utils/is-editable-target";
import {
  areRectsEquivalent,
  getElementTabIndex,
  getHintTargetPreference,
  getMarkerRect,
  hasInteractiveRole,
  isActivatableElement,
  isIntrinsicInteractiveElement
} from "~/src/core/utils/hints/dom";
import type { ReservedHintDirective as HintDirective } from "~/src/utils/hint-reserved-label-directives";

const INPUT_ATTRIBUTE_PATTERNS = [
  /search/i,
  /find/i,
  /query/i,
  /prompt/i,
  /ask/i,
  /chat/i,
  /message/i,
  /composer/i
];
const ATTACH_ATTRIBUTE_PATTERNS = [
  /\battach\b/i,
  /\bupload\b/i,
  /\badd\b.*\bfiles?\b/i,
  /\bpick\b.*\bfiles?\b/i,
  /\bselect\b.*\bfiles?\b/i,
  /\bchoose\b.*\bcomputer\b/i,
  /\bfiles?\b/i,
  /\battachments?\b/i,
  /\bdocument\b/i,
  /\bbrowse\b/i,
  /\bchoose\b/i,
  /\bpaperclip\b/i,
  /\bdropzone\b/i,
  /\bcomposer\b/i,
  /\bcomposer[-_ ]?plus\b/i
];
const ATTACH_EXACT_CONTROL_PATTERNS = [
  /\bcomposer-plus-btn\b/i,
  /\badd files and more\b/i,
  /\bupload files?\b/i
];
const ATTACH_FILE_TYPE_PATTERNS = [/\bimage\b/i, /\bphoto\b/i, /\bmedia\b/i];

const HOME_ATTRIBUTE_PATTERNS = [/\bhome\b/i, /\bhomepage\b/i];
const SIDEBAR_ATTRIBUTE_PATTERNS = [
  /\bmenu\b/i,
  /\bhamburger\b/i,
  /\bnavigation\b/i,
  /\bsidebar\b/i,
  /\bside-nav\b/i,
  /\bsidenav\b/i,
  /\bnavigation rail\b/i,
  /\bdrawer\b/i
];
const SIDEBAR_CONTAINER_PATTERNS = [/\bsidebar\b/i, /\bside-nav\b/i, /\bsidenav\b/i, /\bdrawer\b/i];
const SIDEBAR_OPEN_CLOSE_PATTERNS = [
  /\bopen\s+sidebar\b/i,
  /\bclose\s+sidebar\b/i,
  /\bopen\s+drawer\b/i,
  /\bclose\s+drawer\b/i,
  /\bcollapse\b.*\bsidebar\b/i,
  /\bexpand\b.*\bsidebar\b/i,
  /\bclose-sidebar-button\b/i,
  /\bopen-sidebar-button\b/i
];
const SIDEBAR_NON_NAVIGATION_PATTERNS = [
  /\bprofile\b/i,
  /\baccount\b/i,
  /\buser\b/i,
  /\bavatar\b/i
];
const SIDEBAR_TOGGLE_PATTERNS = [
  /\bguide\b/i,
  /\bguide-button\b/i,
  /\bmenu\b/i,
  /\bmenu-button\b/i,
  /\bnav-toggle\b/i,
  /\bsidebar-toggle\b/i,
  /\bdrawer-toggle\b/i
];
const NEXT_ATTRIBUTE_PATTERNS = [/\bnext\b/i, /\bnewer\b/i];
const NEXT_SHORT_TEXT_PATTERNS = [/^more$/i, /^continue$/i, /^next$/i, /^next page$/i];
const NEXT_STRONG_ATTRIBUTE_PATTERNS = [
  /^next$/i,
  /^next\b/i,
  /\bnext page\b/i,
  /\bnext video\b/i,
  /\bplay next\b/i,
  /\bskip\b.*\bnext\b/i
];
const NEXT_FALSE_POSITIVE_PATTERNS = [
  /\bsign\s*in\b/i,
  /\blog\s*in\b/i,
  /\blog\s*on\b/i,
  /\bservice ?login\b/i,
  /\bauth\b/i,
  /\baccount\b/i,
  /\bregister\b/i,
  /\bjoin\b/i
];
const NOISY_NEXT_CLASS_PATTERNS = [/\byt-spec-button-shape-next\b/i, /\bbutton-next\b/i];
const PREV_ATTRIBUTE_PATTERNS = [/\bprev\b/i, /\bprevious\b/i, /\bolder\b/i];
const PREV_SHORT_TEXT_PATTERNS = [/^back$/i, /^previous$/i, /^previous page$/i, /^prev$/i];
const CANCEL_ATTRIBUTE_PATTERNS = [/\bcancel\b/i, /\bclose\b/i, /\bdismiss\b/i, /\bexit\b/i];
const CANCEL_SHORT_TEXT_PATTERNS = [/^no$/i, /^nope$/i, /^not now$/i, /^never mind$/i];
const SUBMIT_ATTRIBUTE_PATTERNS = [
  /\bsubmit\b/i,
  /\bsave\b/i,
  /\bsend\b/i,
  /\bpost\b/i,
  /\bapply\b/i,
  /\bconfirm\b/i,
  /\brepl(?:y|ies)\b/i,
  /\bpublish\b/i
];
const SUBMIT_SHORT_TEXT_PATTERNS = [/^ok$/i, /^done$/i, /^yes$/i, /^submit$/i, /^reply$/i];
const LIKE_ATTRIBUTE_PATTERNS = [/\blike\b/i, /\bupvote\b/i, /\bthumb[-_ ]?up\b/i];
const LIKE_SHORT_TEXT_PATTERNS = [/^like$/i];
const DISLIKE_ATTRIBUTE_PATTERNS = [/\bdislike\b/i, /\bdownvote\b/i, /\bthumb[-_ ]?down\b/i];
const DISLIKE_SHORT_TEXT_PATTERNS = [/^dislike$/i];
const REACTION_WRAPPER_SELECTOR = [
  "like-button-view-model",
  "dislike-button-view-model",
  "toggle-button-view-model",
  "button-view-model",
  "[class*='segmented-start' i]",
  "[class*='segmented-end' i]",
  "[class*='likebutton' i]",
  "[class*='dislikebutton' i]",
  "[data-testid*='like' i]",
  "[data-testid*='dislike' i]",
  "[id*='like' i]",
  "[id*='dislike' i]"
].join(", ");
const LIKE_STABLE_CONTROL_PATTERNS = [
  /\bsegmented-start\b/i,
  /\blike-button\b/i,
  /\blikebutton\b/i,
  /\blike-button-view-model\b/i,
  /\bytlikebuttonviewmodelhost\b/i,
  /\bthumb[-_ ]?up\b/i,
  /\bupvote\b/i
];
const DISLIKE_STABLE_CONTROL_PATTERNS = [
  /\bsegmented-end\b/i,
  /\bdislike-button\b/i,
  /\bdislikebutton\b/i,
  /\bdislike-button-view-model\b/i,
  /\bthumb[-_ ]?down\b/i,
  /\bdownvote\b/i
];

const HOME_LOGO_PATTERNS = [/\blogo\b/i, /\bbrand\b/i];
const HOME_PATHS = new Set(["/", "/home", "/homepage", "/dashboard"]);

type ElementFeatureVector = {
  rect: DOMRect | null;
  isSelectable: boolean;
  textContent?: string;
  joinedAttributeTextCache: Map<string, string>;
  closestCache: Map<string, Element | null>;
};

type ActionDirectiveOptions = {
  allowFormSignals?: boolean;
  relValues?: string[];
  boostDialogContext?: boolean;
  shortTextPatterns?: readonly RegExp[];
};

type DirectiveDefinition = {
  directive: HintDirective;
  threshold: number;
  getScore: (
    element: HTMLElement,
    rect: DOMRect | null,
    features: ElementFeatureVector,
    context: { attachScore: number }
  ) => number;
};

const getBestScoringElementIndex = (
  elements: HTMLElement[],
  threshold: number,
  getScore: (element: HTMLElement, index: number) => number
): number | null => {
  let bestIndex: number | null = null;
  let bestScore = threshold;

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    if (!element) {
      continue;
    }

    const score = getScore(element, index);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
};

const getElementTextContent = (element: HTMLElement): string =>
  element.textContent?.replace(/\s+/g, " ").trim() ?? "";

const getCachedElementTextContent = (
  element: HTMLElement,
  features?: ElementFeatureVector
): string => {
  if (!features) {
    return getElementTextContent(element);
  }

  if (features.textContent !== undefined) {
    return features.textContent;
  }

  const textContent = getElementTextContent(element);
  features.textContent = textContent;
  return textContent;
};

const getElementValueText = (element: HTMLElement): string => {
  if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
    return element.value?.trim() ?? "";
  }

  return "";
};

const getCachedElementValueText = (
  element: HTMLElement,
  features?: ElementFeatureVector
): string => {
  if (!features) {
    return getElementValueText(element);
  }

  const cacheKey = "__value_text__";
  const cachedValue = features.joinedAttributeTextCache.get(cacheKey);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const value = getElementValueText(element);
  features.joinedAttributeTextCache.set(cacheKey, value);
  return value;
};

const getSemanticControlText = (element: HTMLElement, features?: ElementFeatureVector): string => {
  const textContent = getCachedElementTextContent(element, features);
  const valueText = getCachedElementValueText(element, features);
  const combinedText = [textContent, valueText]
    .filter((part) => part.length > 0)
    .join(" ")
    .trim();

  if (!combinedText || combinedText.length > 48) {
    return "";
  }

  const wordCount = combinedText.split(/\s+/).filter((part) => part.length > 0).length;
  return wordCount <= 6 ? combinedText : "";
};

const isLikelyShortControlText = (value: string): boolean => {
  if (!value || value.length > 24) {
    return false;
  }

  const wordCount = value.split(/\s+/).filter((part) => part.length > 0).length;
  return wordCount > 0 && wordCount <= 4;
};

const getJoinedAttributeText = (
  element: HTMLElement,
  attributeNames: string[],
  extras: string[] = []
): string =>
  [...attributeNames.map((name) => element.getAttribute(name)), ...extras]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");

const getCachedJoinedAttributeText = (
  element: HTMLElement,
  attributeNames: string[],
  extras: string[] = [],
  features?: ElementFeatureVector
): string => {
  if (!features) {
    return getJoinedAttributeText(element, attributeNames, extras);
  }

  const cacheKey = `${attributeNames.join("\u0000")}::${extras.join("\u0001")}`;
  const cachedValue = features.joinedAttributeTextCache.get(cacheKey);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const value = getJoinedAttributeText(element, attributeNames, extras);
  features.joinedAttributeTextCache.set(cacheKey, value);
  return value;
};

const getCachedClosest = (
  element: HTMLElement,
  selector: string,
  features?: ElementFeatureVector
): Element | null => {
  if (!features) {
    return element.closest(selector);
  }

  if (features.closestCache.has(selector)) {
    return features.closestCache.get(selector) ?? null;
  }

  const match = element.closest(selector);
  features.closestCache.set(selector, match);
  return match;
};

const textMatchesAnyPattern = (text: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

const getReactionControlAttributeText = (
  element: HTMLElement,
  features?: ElementFeatureVector
): string =>
  getCachedJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "data-test-id", "title", "class", "type"],
    [element.tagName.toLowerCase()],
    features
  );

const getReactionWrappers = (
  element: HTMLElement,
  features?: ElementFeatureVector
): HTMLElement[] => {
  const wrappers: HTMLElement[] = [];
  let current = getCachedClosest(element, REACTION_WRAPPER_SELECTOR, features);

  while (current instanceof HTMLElement) {
    if (current !== element) {
      wrappers.push(current);
    }

    current = current.parentElement?.closest(REACTION_WRAPPER_SELECTOR) ?? null;
  }

  return wrappers;
};

const getReactionSignalText = (element: HTMLElement, features?: ElementFeatureVector): string => {
  const parts = [getReactionControlAttributeText(element, features)];

  for (const wrapper of getReactionWrappers(element, features)) {
    parts.push(
      getJoinedAttributeText(
        wrapper,
        ["name", "id", "aria-label", "data-testid", "data-test-id", "title", "class", "type"],
        [wrapper.tagName.toLowerCase()]
      )
    );
  }

  return parts.filter((part) => part.length > 0).join(" ");
};

const getNormalizedSameOriginPath = (href: string): string | null => {
  try {
    const resolvedUrl = new URL(href, window.location.href);
    if (resolvedUrl.origin !== window.location.origin) {
      return null;
    }

    return resolvedUrl.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
};

const getInputCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  if (!isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 100;
  const attributeText = getCachedJoinedAttributeText(
    element,
    ["type", "name", "id", "placeholder", "aria-label", "data-testid", "role"],
    [],
    features
  );

  if (textMatchesAnyPattern(attributeText, INPUT_ATTRIBUTE_PATTERNS)) {
    score += 120;
  }

  if (element === getDeepActiveElement()) {
    score += 80;
  }

  if (
    element instanceof HTMLInputElement &&
    ["search", "text", "email", "url", "tel"].includes(element.type)
  ) {
    score += 40;
  }

  if (element instanceof HTMLTextAreaElement || element.isContentEditable) {
    score += 60;
  }

  if (getCachedClosest(element, "search, [role='search'], form", features)) {
    score += 30;
  }

  score += Math.min(400, rect.width) / 4;
  score += Math.min(120, rect.height) / 6;

  return score;
};

const getAttachAttributeText = (element: HTMLElement, features?: ElementFeatureVector): string => {
  const textContent = getCachedElementTextContent(element, features);
  const valueText = getCachedElementValueText(element, features);
  return getCachedJoinedAttributeText(
    element,
    [
      "type",
      "name",
      "id",
      "class",
      "placeholder",
      "aria-label",
      "title",
      "data-testid",
      "role",
      "value"
    ],
    [textContent, valueText],
    features
  );
};

const getAttachPresentationPreference = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = getHintTargetPreference(element);
  const attributeText = getAttachAttributeText(element, features);

  if (textMatchesAnyPattern(attributeText, ATTACH_EXACT_CONTROL_PATTERNS)) {
    score += 400;
  }

  if (element instanceof HTMLButtonElement) {
    score += 220;
  }

  if (isIntrinsicInteractiveElement(element)) {
    score += 140;
  }

  if (element.hasAttribute("aria-haspopup")) {
    score += 80;
  }

  if (element.hasAttribute("aria-label") || element.hasAttribute("title")) {
    score += 60;
  }

  score -= Math.min(400, rect.width * rect.height) / 20;
  return score;
};

const getAttachCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  if (!isActivatableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (
    isSelectableElement(element) &&
    !(element instanceof HTMLInputElement && element.type.toLowerCase() === "file")
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  let hasStrongSignal = false;
  const attributeText = getAttachAttributeText(element, features);

  if (textMatchesAnyPattern(attributeText, ATTACH_ATTRIBUTE_PATTERNS)) {
    score += 260;
    hasStrongSignal = true;
  }

  if (textMatchesAnyPattern(attributeText, ATTACH_EXACT_CONTROL_PATTERNS)) {
    score += 240;
    hasStrongSignal = true;
  }

  if (textMatchesAnyPattern(attributeText, ATTACH_FILE_TYPE_PATTERNS)) {
    score += 60;
  }

  if (element instanceof HTMLInputElement && element.type.toLowerCase() === "file") {
    score += 320;
    hasStrongSignal = true;

    if (element.accept) {
      score += 120;
    }
  }

  if (
    element instanceof HTMLLabelElement &&
    element.control instanceof HTMLInputElement &&
    element.control.type.toLowerCase() === "file"
  ) {
    score += 340;
    hasStrongSignal = true;
  }

  if (getCachedClosest(element, "form", features)) {
    score += 60;
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLAnchorElement ||
    element instanceof HTMLAreaElement ||
    element.getAttribute("role")?.toLowerCase() === "button"
  ) {
    score += 40;
  }

  if (element.hasAttribute("aria-haspopup")) {
    score += 40;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += Math.min(220, rect.width) / 10;
  score += Math.min(120, rect.height) / 12;

  return score;
};

const getRectOverlapRatio = (leftRect: DOMRect, rightRect: DOMRect): number => {
  const intersectionWidth = Math.max(
    0,
    Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left)
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top)
  );
  const intersectionArea = intersectionWidth * intersectionHeight;
  const smallerArea = Math.max(
    1,
    Math.min(leftRect.width * leftRect.height, rightRect.width * rightRect.height)
  );

  return intersectionArea / smallerArea;
};

const getRectGapDistance = (leftRect: DOMRect, rightRect: DOMRect): number => {
  const horizontalGap = Math.max(
    0,
    leftRect.left - rightRect.right,
    rightRect.left - leftRect.right
  );
  const verticalGap = Math.max(0, leftRect.top - rightRect.bottom, rightRect.top - leftRect.bottom);

  return Math.hypot(horizontalGap, verticalGap);
};

const isLikelyHiddenFileInputControl = (
  element: HTMLElement,
  rectOverride?: DOMRect | null
): boolean => {
  if (!(element instanceof HTMLInputElement) || element.type.toLowerCase() !== "file") {
    return false;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const hiddenClassText = `${element.className} ${element.id}`;

  return (
    rect.width <= 4 ||
    rect.height <= 4 ||
    style.opacity === "0" ||
    style.clipPath !== "none" ||
    /\bsr-only\b|\bvisually-hidden\b|\bscreen-reader\b/i.test(hiddenClassText)
  );
};

const isRectCenterNearTarget = (
  targetRect: DOMRect,
  candidateRect: DOMRect,
  padding = 12
): boolean => {
  const centerX = candidateRect.left + candidateRect.width / 2;
  const centerY = candidateRect.top + candidateRect.height / 2;

  return (
    centerX >= targetRect.left - padding &&
    centerX <= targetRect.right + padding &&
    centerY >= targetRect.top - padding &&
    centerY <= targetRect.bottom + padding
  );
};

const remapAttachDirectiveIndex = (
  elements: HTMLElement[],
  attachIndex: number,
  getRect: (element: HTMLElement) => DOMRect | null
): number => {
  const attachElement = elements[attachIndex];
  if (!attachElement) {
    return attachIndex;
  }

  const attachRect = getRect(attachElement);
  if (!attachRect) {
    return attachIndex;
  }

  let bestIndex = attachIndex;
  let bestPreference = getAttachPresentationPreference(attachElement, attachRect);
  const shouldPreferVisibleProxy = isLikelyHiddenFileInputControl(attachElement, attachRect);

  elements.forEach((element, index) => {
    const score = getAttachCandidateScore(element, getRect(element));
    if (score === Number.NEGATIVE_INFINITY) {
      return;
    }

    const rect = getRect(element);
    if (!rect) {
      return;
    }

    const isNearbyVisibleProxy =
      shouldPreferVisibleProxy &&
      index !== attachIndex &&
      !isLikelyHiddenFileInputControl(element, rect) &&
      getRectGapDistance(attachRect, rect) <= 80;

    if (!isNearbyVisibleProxy && getRectOverlapRatio(attachRect, rect) < 0.7) {
      return;
    }

    const preference = getAttachPresentationPreference(element, rect);
    if (preference > bestPreference) {
      bestPreference = preference;
      bestIndex = index;
    }
  });

  return bestIndex;
};

export const getPreferredInputElementIndex = (elements: HTMLElement[]): number | null => {
  let selectableCount = 0;
  let onlySelectableIndex: number | null = null;

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    if (!element || !isSelectableElement(element)) {
      continue;
    }

    selectableCount += 1;
    onlySelectableIndex = index;

    if (selectableCount > 1) {
      break;
    }
  }

  if (selectableCount === 1) {
    return onlySelectableIndex;
  }

  return getBestScoringElementIndex(elements, 180, (element) => getInputCandidateScore(element));
};

export const getPreferredSearchElementIndex = (elements: HTMLElement[]): number | null => {
  return getPreferredInputElementIndex(elements);
};

export const getPreferredAttachElementIndex = (elements: HTMLElement[]): number | null => {
  return getBestScoringElementIndex(elements, 220, (element) => getAttachCandidateScore(element));
};

const getHomeCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  if (
    !(
      element instanceof HTMLAnchorElement ||
      element instanceof HTMLAreaElement ||
      element instanceof HTMLButtonElement ||
      hasInteractiveRole(element) ||
      element.hasAttribute("onclick")
    )
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  let hasStrongSignal = false;
  const textContent = getCachedElementTextContent(element, features);
  const logoText = getCachedJoinedAttributeText(
    element,
    ["id", "class", "data-testid", "aria-label", "title"],
    [],
    features
  );
  const hasLogoSignal = textMatchesAnyPattern(logoText, HOME_LOGO_PATTERNS);
  const attributeText = getCachedJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "role", "title", "class"],
    [textContent],
    features
  );

  if (textMatchesAnyPattern(attributeText, HOME_ATTRIBUTE_PATTERNS)) {
    score += 220;
    hasStrongSignal = true;
  }

  const href = element.getAttribute("href");
  if (href) {
    const normalizedPath = getNormalizedSameOriginPath(href);
    if (normalizedPath && HOME_PATHS.has(normalizedPath)) {
      score += 220;
      hasStrongSignal = true;

      if (normalizedPath === "/" && hasLogoSignal) {
        score += 260;
      }
    }
  }

  const relValue = element.getAttribute("rel")?.toLowerCase() ?? "";
  if (relValue.split(/\s+/).includes("home")) {
    score += 180;
    hasStrongSignal = true;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  if (element.getAttribute("aria-current")?.toLowerCase() === "page") {
    score += 40;
  }

  if (getCachedClosest(element, "nav, header, [role='navigation']", features)) {
    score += 40;
  }

  score += Math.min(220, rect.width) / 8;
  score += Math.min(120, rect.height) / 12;

  return score;
};

export const getPreferredHomeElementIndex = (elements: HTMLElement[]): number | null => {
  return getBestScoringElementIndex(elements, 180, (element) => getHomeCandidateScore(element));
};

const getSidebarControlsSignalScore = (element: HTMLElement): number => {
  const controlsValue = element.getAttribute("aria-controls");
  if (!controlsValue) {
    return 0;
  }

  let score = 0;

  for (const controlId of controlsValue.split(/\s+/).map((part) => part.trim())) {
    if (!controlId) {
      continue;
    }

    if (textMatchesAnyPattern(controlId, SIDEBAR_CONTAINER_PATTERNS)) {
      score += 220;
    }

    const controlledElement = document.getElementById(controlId);
    if (!(controlledElement instanceof HTMLElement)) {
      continue;
    }

    const controlledTagName = controlledElement.tagName.toLowerCase();
    const controlledRole = controlledElement.getAttribute("role")?.toLowerCase() ?? "";
    const controlledAttributeText = getJoinedAttributeText(controlledElement, [
      "id",
      "class",
      "aria-label",
      "title",
      "data-testid",
      "role"
    ]);

    if (controlledTagName === "aside" || controlledRole === "complementary") {
      score += 180;
    }

    if (
      controlledTagName === "nav" ||
      controlledRole === "navigation" ||
      textMatchesAnyPattern(controlledAttributeText, SIDEBAR_CONTAINER_PATTERNS)
    ) {
      score += 140;
    }
  }

  return score;
};

const getSidebarCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  if (!isActivatableElement(element) || isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 40;
  let hasStrongSignal = false;
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();
  const textContent = getCachedElementTextContent(element, features);
  const attributeText = getCachedJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "role", "title", "class"],
    [textContent],
    features
  );
  const controlsSignalScore = getSidebarControlsSignalScore(element);
  const hasSidebarAttributeSignal = textMatchesAnyPattern(
    attributeText,
    SIDEBAR_ATTRIBUTE_PATTERNS
  );
  const hasSidebarToggleSignal = textMatchesAnyPattern(attributeText, SIDEBAR_TOGGLE_PATTERNS);
  const hasNonNavigationMenuSignal = textMatchesAnyPattern(
    attributeText,
    SIDEBAR_NON_NAVIGATION_PATTERNS
  );

  if (hasNonNavigationMenuSignal && controlsSignalScore === 0 && !hasSidebarAttributeSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += controlsSignalScore;
  if (controlsSignalScore > 0) {
    hasStrongSignal = true;
  }

  if (element instanceof HTMLButtonElement || role === "button") {
    score += 60;
  }

  if (element instanceof HTMLAnchorElement && element.hasAttribute("href")) {
    score += 30;
  }

  if (tagName === "summary") {
    score += 20;
  }

  if (hasSidebarAttributeSignal) {
    score += 220;
    hasStrongSignal = true;
  }

  if (textMatchesAnyPattern(attributeText, SIDEBAR_OPEN_CLOSE_PATTERNS)) {
    score += 320;
    hasStrongSignal = true;
  }

  if (element.id === "guide-button" || !!getCachedClosest(element, "#guide-button", features)) {
    score += 700;
    hasStrongSignal = true;
  }

  if (hasSidebarToggleSignal) {
    score += 260;
    hasStrongSignal = true;
  }

  if (
    getCachedClosest(
      element,
      "header, [role='banner'], [role='navigation'], [id*='masthead' i], [class*='masthead' i], [id*='topbar' i], [class*='topbar' i]",
      features
    )
  ) {
    score += 120;
  }

  if (element.hasAttribute("aria-expanded")) {
    score += 70;

    if (element.getAttribute("aria-expanded") === "true" && controlsSignalScore > 0) {
      score += 180;
    }
  }

  if (element.hasAttribute("aria-haspopup")) {
    score += 30;
  }

  if (getCachedClosest(element, "header, [role='banner'], [role='navigation']", features)) {
    score += 40;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += Math.min(120, rect.height) / 8;
  score += Math.min(120, rect.width) / 8;

  if (rect.width <= 96 && rect.height <= 96) {
    score += 30;
  }

  if (rect.left < window.innerWidth * 0.35 && rect.top < window.innerHeight * 0.3) {
    score += 60;
  }

  if (rect.width > window.innerWidth * 0.6) {
    score -= 80;
  }

  return score;
};

export const getPreferredSidebarElementIndex = (elements: HTMLElement[]): number | null => {
  return getBestScoringElementIndex(elements, 220, (element) => getSidebarCandidateScore(element));
};

const getActionDirectiveCandidateScore = (
  element: HTMLElement,
  patterns: readonly RegExp[],
  options: ActionDirectiveOptions = {},
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  if (!isActivatableElement(element) || isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 20;
  let hasStrongSignal = false;
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();
  const semanticControlText = getSemanticControlText(element, features);
  const attributeText = getCachedJoinedAttributeText(
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
    [semanticControlText],
    features
  );

  if (textMatchesAnyPattern(attributeText, patterns)) {
    score += 240;
    hasStrongSignal = true;
  }

  if (
    options.shortTextPatterns &&
    semanticControlText &&
    isLikelyShortControlText(semanticControlText) &&
    textMatchesAnyPattern(semanticControlText, options.shortTextPatterns)
  ) {
    score += 220;
    hasStrongSignal = true;
  }

  if (
    options.relValues &&
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement)
  ) {
    const relValue = element.getAttribute("rel")?.toLowerCase() ?? "";
    const relParts = relValue.split(/\s+/);

    if (options.relValues.some((value) => relParts.includes(value))) {
      score += 260;
      hasStrongSignal = true;
    }
  }

  if (element instanceof HTMLButtonElement || role === "button") {
    score += 50;
  }

  if (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) {
    score += 40;
  }

  if (tagName === "summary") {
    score += 20;
  }

  if (options.allowFormSignals) {
    if (element instanceof HTMLInputElement && element.type.toLowerCase() === "submit") {
      score += 320;
      hasStrongSignal = true;
    }

    if (getCachedClosest(element, "form", features)) {
      score += 70;
    }
  }

  if (options.boostDialogContext) {
    if (getCachedClosest(element, "dialog, [role='dialog'], [aria-modal='true']", features)) {
      score += 90;
    }

    if (
      getCachedClosest(
        element,
        "[id*='modal' i], [class*='modal' i], [id*='popup' i], [class*='popup' i]",
        features
      )
    ) {
      score += 70;
    }
  }

  if (
    getCachedClosest(
      element,
      "[aria-label*='pagination' i], [class*='pagination' i], nav, [role='navigation']",
      features
    )
  ) {
    score += 60;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += Math.min(120, rect.height) / 10;
  score += Math.min(220, rect.width) / 12;

  return score;
};

const hasReactionSiblingSignal = (
  element: HTMLElement,
  siblingPatterns: readonly RegExp[],
  features?: ElementFeatureVector
): boolean => {
  const candidateContainers = [
    element.parentElement,
    ...getReactionWrappers(element, features).map((wrapper) => wrapper.parentElement)
  ].filter((container): container is HTMLElement => container instanceof HTMLElement);

  return candidateContainers.some((parent) =>
    Array.from(parent.children).some((sibling) => {
      if (sibling === element || !(sibling instanceof HTMLElement)) {
        return false;
      }

      const siblingText = getReactionSignalText(sibling);
      return textMatchesAnyPattern(siblingText, siblingPatterns);
    })
  );
};

const getReactionDirectiveCandidateScore = (
  element: HTMLElement,
  controlPatterns: readonly RegExp[],
  siblingPatterns: readonly RegExp[],
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  if (!isActivatableElement(element) || isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = Number.NEGATIVE_INFINITY;
  const attributeText = getReactionSignalText(element, features);
  const hasStableSignal = textMatchesAnyPattern(attributeText, controlPatterns);
  const hasSiblingSignal = hasReactionSiblingSignal(element, siblingPatterns, features);

  if (!hasStableSignal && !hasSiblingSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score = 200;

  if (hasStableSignal) {
    score += 120;
  }

  if (hasSiblingSignal) {
    score += 70;
  }

  if (element.hasAttribute("aria-pressed")) {
    score += 20;
  }

  score += Math.min(120, rect.height) / 10;
  score += Math.min(220, rect.width) / 12;

  return score;
};

const getLikeCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number =>
  Math.max(
    getActionDirectiveCandidateScore(
      element,
      LIKE_ATTRIBUTE_PATTERNS,
      {
        shortTextPatterns: LIKE_SHORT_TEXT_PATTERNS
      },
      rectOverride,
      features
    ),
    getReactionDirectiveCandidateScore(
      element,
      LIKE_STABLE_CONTROL_PATTERNS,
      DISLIKE_STABLE_CONTROL_PATTERNS,
      rectOverride,
      features
    )
  );

const getDislikeCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number =>
  Math.max(
    getActionDirectiveCandidateScore(
      element,
      DISLIKE_ATTRIBUTE_PATTERNS,
      {
        shortTextPatterns: DISLIKE_SHORT_TEXT_PATTERNS
      },
      rectOverride,
      features
    ),
    getReactionDirectiveCandidateScore(
      element,
      DISLIKE_STABLE_CONTROL_PATTERNS,
      LIKE_STABLE_CONTROL_PATTERNS,
      rectOverride,
      features
    )
  );

const getCancelCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  const score = getActionDirectiveCandidateScore(
    element,
    CANCEL_ATTRIBUTE_PATTERNS,
    {
      boostDialogContext: true,
      shortTextPatterns: CANCEL_SHORT_TEXT_PATTERNS
    },
    rectOverride,
    features
  );

  if (score === Number.NEGATIVE_INFINITY) {
    return score;
  }

  const attributeText = getCachedJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "data-test-id", "role", "title", "class", "type"],
    [],
    features
  );

  if (
    textMatchesAnyPattern(attributeText, SIDEBAR_CONTAINER_PATTERNS) ||
    getSidebarControlsSignalScore(element) > 0
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  return score;
};

const getNextCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  const score = getActionDirectiveCandidateScore(
    element,
    NEXT_ATTRIBUTE_PATTERNS,
    {
      relValues: ["next"],
      shortTextPatterns: NEXT_SHORT_TEXT_PATTERNS
    },
    rectOverride,
    features
  );

  if (score === Number.NEGATIVE_INFINITY) {
    return score;
  }

  const textContent = getCachedElementTextContent(element, features);
  const semanticAttributeText = getCachedJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "data-test-id", "role", "title", "type"],
    [textContent],
    features
  );
  const fullAttributeText = getCachedJoinedAttributeText(
    element,
    [
      "name",
      "id",
      "aria-label",
      "data-testid",
      "data-test-id",
      "role",
      "title",
      "class",
      "type",
      "href",
      "rel"
    ],
    [],
    features
  );
  const hasStrongSemanticSignal = textMatchesAnyPattern(
    semanticAttributeText,
    NEXT_STRONG_ATTRIBUTE_PATTERNS
  );
  const hasNoisyClassSignal = textMatchesAnyPattern(fullAttributeText, NOISY_NEXT_CLASS_PATTERNS);

  if (textMatchesAnyPattern(fullAttributeText, NEXT_FALSE_POSITIVE_PATTERNS)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (hasNoisyClassSignal && !hasStrongSemanticSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  return hasStrongSemanticSignal ? score + 180 : score;
};

const getPreferredActionDirectiveElementIndex = (
  elements: HTMLElement[],
  patterns: readonly RegExp[],
  threshold: number,
  options: ActionDirectiveOptions = {}
): number | null => {
  return getBestScoringElementIndex(elements, threshold, (element) =>
    getActionDirectiveCandidateScore(element, patterns, options)
  );
};

export const getPreferredNextElementIndex = (elements: HTMLElement[]): number | null =>
  getBestScoringElementIndex(elements, 200, (element) => getNextCandidateScore(element));

export const getPreferredPrevElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, PREV_ATTRIBUTE_PATTERNS, 200, {
    relValues: ["prev"],
    shortTextPatterns: PREV_SHORT_TEXT_PATTERNS
  });

export const getPreferredCancelElementIndex = (elements: HTMLElement[]): number | null =>
  getBestScoringElementIndex(elements, 220, (element) => getCancelCandidateScore(element));

export const getPreferredSubmitElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, SUBMIT_ATTRIBUTE_PATTERNS, 220, {
    allowFormSignals: true,
    shortTextPatterns: SUBMIT_SHORT_TEXT_PATTERNS
  });

export const getPreferredLikeElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, LIKE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: LIKE_SHORT_TEXT_PATTERNS
  });

export const getPreferredDislikeElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, DISLIKE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: DISLIKE_SHORT_TEXT_PATTERNS
  });

const DIRECTIVE_DEFINITIONS: DirectiveDefinition[] = [
  {
    directive: "input",
    threshold: 180,
    getScore: (element, rect, features) => getInputCandidateScore(element, rect, features)
  },
  {
    directive: "attach",
    threshold: 220,
    getScore: (element, rect, features) => getAttachCandidateScore(element, rect, features)
  },
  {
    directive: "home",
    threshold: 180,
    getScore: (element, rect, features) => getHomeCandidateScore(element, rect, features)
  },
  {
    directive: "sidebar",
    threshold: 220,
    getScore: (element, rect, features) => getSidebarCandidateScore(element, rect, features)
  },
  {
    directive: "next",
    threshold: 200,
    getScore: (element, rect, features, context) =>
      context.attachScore === Number.NEGATIVE_INFINITY
        ? getNextCandidateScore(element, rect, features)
        : Number.NEGATIVE_INFINITY
  },
  {
    directive: "prev",
    threshold: 200,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        PREV_ATTRIBUTE_PATTERNS,
        {
          relValues: ["prev"],
          shortTextPatterns: PREV_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "cancel",
    threshold: 220,
    getScore: (element, rect, features) => getCancelCandidateScore(element, rect, features)
  },
  {
    directive: "submit",
    threshold: 220,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        SUBMIT_ATTRIBUTE_PATTERNS,
        {
          allowFormSignals: true,
          shortTextPatterns: SUBMIT_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "like",
    threshold: 220,
    getScore: (element, rect, features) => getLikeCandidateScore(element, rect, features)
  },
  {
    directive: "dislike",
    threshold: 220,
    getScore: (element, rect, features) => getDislikeCandidateScore(element, rect, features)
  }
];

const getDefaultDirectiveThresholds = (): Record<HintDirective, number> => ({
  input: 180,
  attach: 220,
  home: 180,
  sidebar: 220,
  next: 200,
  prev: 200,
  cancel: 220,
  submit: 220,
  like: 220,
  dislike: 220
});

export const getPreferredDirectiveIndexes = (
  elements: HTMLElement[]
): Partial<Record<HintDirective, number>> => {
  const featureCache = new WeakMap<HTMLElement, ElementFeatureVector>();
  const bestIndexes: Partial<Record<HintDirective, number>> = {};
  const bestScores = getDefaultDirectiveThresholds();
  let selectableCount = 0;
  let onlySelectableIndex: number | null = null;

  const getFeatures = (element: HTMLElement): ElementFeatureVector => {
    const cached = featureCache.get(element);
    if (cached) {
      return cached;
    }

    const features: ElementFeatureVector = {
      rect: getMarkerRect(element),
      isSelectable: isSelectableElement(element),
      joinedAttributeTextCache: new Map(),
      closestCache: new Map()
    };

    featureCache.set(element, features);
    return features;
  };

  const updateBest = (directive: HintDirective, score: number, index: number): void => {
    if (score > bestScores[directive]) {
      bestScores[directive] = score;
      bestIndexes[directive] = index;
    }
  };

  elements.forEach((element, index) => {
    const features = getFeatures(element);

    if (features.isSelectable) {
      selectableCount += 1;
      onlySelectableIndex = index;
    }

    const attachScore = getAttachCandidateScore(element, features.rect, features);
    const context = { attachScore };

    for (const definition of DIRECTIVE_DEFINITIONS) {
      const score = definition.getScore(element, features.rect, features, context);
      updateBest(definition.directive, score, index);
    }
  });

  if (selectableCount === 1 && onlySelectableIndex !== null) {
    bestIndexes.input = onlySelectableIndex;
  }

  if (bestIndexes.attach !== undefined) {
    bestIndexes.attach = remapAttachDirectiveIndex(
      elements,
      bestIndexes.attach,
      (element) => getFeatures(element).rect
    );
  }

  return bestIndexes;
};

export const getAttachEquivalentIndexes = (
  elements: HTMLElement[],
  attachIndex: number
): number[] => {
  const attachElement = elements[attachIndex];
  if (!attachElement) {
    return [];
  }

  const attachRect = getMarkerRect(attachElement);
  if (!attachRect) {
    return [attachIndex];
  }

  const equivalentIndexes: number[] = [];

  elements.forEach((element, index) => {
    const score = getAttachCandidateScore(element);
    if (score === Number.NEGATIVE_INFINITY) {
      return;
    }

    const rect = getMarkerRect(element);
    if (!rect || getRectOverlapRatio(attachRect, rect) < 0.7) {
      return;
    }

    equivalentIndexes.push(index);
  });

  return equivalentIndexes;
};

export const getStronglyOverlappingHintIndexes = (
  elements: HTMLElement[],
  targetIndex: number,
  minimumOverlapRatio = 0.35
): number[] => {
  const targetElement = elements[targetIndex];
  if (!targetElement) {
    return [];
  }

  const targetRect = getMarkerRect(targetElement);
  if (!targetRect) {
    return [targetIndex];
  }

  const overlappingIndexes: number[] = [];

  elements.forEach((element, index) => {
    const rect = getMarkerRect(element);
    if (
      !rect ||
      (getRectOverlapRatio(targetRect, rect) < minimumOverlapRatio &&
        !isRectCenterNearTarget(targetRect, rect))
    ) {
      return;
    }

    overlappingIndexes.push(index);
  });

  return overlappingIndexes;
};

export const getSuppressedAttachRelatedHintIndexes = (
  elements: HTMLElement[],
  attachIndex: number,
  reservedDirectivesByIndex: ReadonlyMap<number, HintDirective>
): Set<number> => {
  const suppressedIndexes = new Set<number>();
  const attachElement = elements[attachIndex];

  if (!attachElement) {
    return suppressedIndexes;
  }

  const attachRect = getMarkerRect(attachElement);
  if (!attachRect) {
    return suppressedIndexes;
  }

  elements.forEach((element, index) => {
    if (index === attachIndex) {
      return;
    }

    const rect = getMarkerRect(element);
    if (!rect) {
      return;
    }

    const overlapRatio = getRectOverlapRatio(attachRect, rect);

    if (getAttachCandidateScore(element) !== Number.NEGATIVE_INFINITY && overlapRatio >= 0.7) {
      suppressedIndexes.add(index);
      return;
    }

    if (
      !reservedDirectivesByIndex.has(index) &&
      (overlapRatio >= 0.35 || isRectCenterNearTarget(attachRect, rect))
    ) {
      suppressedIndexes.add(index);
    }
  });

  return suppressedIndexes;
};

export { getAttachCandidateScore };