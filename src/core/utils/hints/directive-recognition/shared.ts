import { getDeepActiveElement, isSelectableElement } from "~/src/core/utils/is-editable-target";
import {
  getHintTargetPreference,
  getMarkerRect,
  hasInteractiveRole,
  isActivatableElement,
  isIntrinsicInteractiveElement
} from "~/src/core/utils/hints/dom";
import type { ReservedHintDirective as HintDirective } from "~/src/utils/hint-reserved-label-directives";

export {
  getHintTargetPreference,
  getMarkerRect,
  hasInteractiveRole,
  isActivatableElement,
  isIntrinsicInteractiveElement,
  isSelectableElement
};
export type { HintDirective };

export const INPUT_ATTRIBUTE_PATTERNS = [
  /search/i,
  /find/i,
  /query/i,
  /prompt/i,
  /ask/i,
  /chat/i,
  /message/i,
  /composer/i
];
export const ATTACH_ATTRIBUTE_PATTERNS = [
  /\battach\b/i,
  /\bupload\b/i,
  /\b(update|change|edit)\b.*\b(photo|avatar|image|picture)\b/i,
  /\badd\b.*\bfiles?\b/i,
  /\bpick\b.*\bfiles?\b/i,
  /\bselect\b.*\bfiles?\b/i,
  /\bchoose\b.*\bcomputer\b/i,
  /\bfiles?\b/i,
  /\battachments?\b/i,
  /\bbrowse\b/i,
  /\bpaperclip\b/i,
  /\bdropzone\b/i,
  /\bcomposer\b/i,
  /\bcomposer[-_ ]?plus\b/i
];
export const ATTACH_EXACT_CONTROL_PATTERNS = [
  /\bcomposer-plus-btn\b/i,
  /\badd files and more\b/i,
  /\bupload files?\b/i,
  /\bupdate profile photo\b/i
];
export const ATTACH_FILE_TYPE_PATTERNS = [/\bimage\b/i, /\bphoto\b/i, /\bmedia\b/i];
export const SHARE_ATTRIBUTE_PATTERNS = [
  /\bshare\b/i,
  /\brepost\b/i,
  /\breshare\b/i,
  /\bforward\b/i,
  /\bcopy\b.*\blink\b/i
];
export const SHARE_SHORT_TEXT_PATTERNS = [/^share$/i, /^repost$/i, /^forward$/i];
export const DOWNLOAD_ATTRIBUTE_PATTERNS = [
  /\bdownload\b/i,
  /\boffline\b/i,
  /\bexport\b/i,
  /\bsave\b.*\b(file|image|video|audio|photo|media|pdf|document)\b/i
];
export const DOWNLOAD_SHORT_TEXT_PATTERNS = [
  /^download$/i,
  /^export$/i,
  /^save (file|image|video|audio|photo|media|pdf|document)$/i
];
export const LOGIN_ATTRIBUTE_PATTERNS = [
  /\bsign[\s-]?in\b/i,
  /\blog[\s-]?in\b/i,
  /\blog[\s-]?on\b/i,
  /\blogin\b/i,
  /\bservice ?login\b/i,
  /\bauthenticate\b/i,
  /\bauth\b/i,
  /\bsso\b/i
];
export const LOGIN_SHORT_TEXT_PATTERNS = [/^sign[\s-]?in$/i, /^log[\s-]?in$/i, /^login$/i];
export const HOME_ATTRIBUTE_PATTERNS = [/\bhome\b/i, /\bhomepage\b/i];
export const SIDEBAR_ATTRIBUTE_PATTERNS = [
  /\bmenu\b/i,
  /\bhamburger\b/i,
  /\bnavigation\b/i,
  /\bsidebar\b/i,
  /\bside-nav\b/i,
  /\bsidenav\b/i,
  /\bnavigation rail\b/i,
  /\bdrawer\b/i
];
export const SIDEBAR_STRONG_ATTRIBUTE_PATTERNS = [
  /\bhamburger\b/i,
  /\bnavigation\b/i,
  /\bsidebar\b/i,
  /\bside-nav\b/i,
  /\bsidenav\b/i,
  /\bnavigation rail\b/i
];
export const SIDEBAR_CONTAINER_PATTERNS = [
  /\bsidebar\b/i,
  /\bside-nav\b/i,
  /\bsidenav\b/i,
  /\bdrawer\b/i
];
export const SIDEBAR_OPEN_CLOSE_PATTERNS = [
  /\bopen\s+sidebar\b/i,
  /\bclose\s+sidebar\b/i,
  /\bopen\s+navigation\b/i,
  /\bclose\s+navigation\b/i,
  /\bopen\s+drawer\b/i,
  /\bclose\s+drawer\b/i,
  /\bcollapse\b.*\bsidebar\b/i,
  /\bexpand\b.*\bsidebar\b/i,
  /\bcollapse\b.*\bnavigation\b/i,
  /\bexpand\b.*\bnavigation\b/i,
  /\bclose-sidebar-button\b/i,
  /\bopen-sidebar-button\b/i,
  /\bnav-collapse\b/i,
  /\bnav-expand\b/i
];
export const SIDEBAR_NON_NAVIGATION_PATTERNS = [
  /\bprofile\b/i,
  /\baccount\b/i,
  /\buser\b/i,
  /\bavatar\b/i,
  /\bactions?\b/i,
  /\boptions?\b/i,
  /\boverflow\b/i
];
export const SIDEBAR_TOGGLE_PATTERNS = [
  /\bguide\b/i,
  /\bguide-button\b/i,
  /\bmenu\b/i,
  /\bmenu-button\b/i,
  /\bnav-toggle\b/i,
  /\bsidebar-toggle\b/i,
  /\bdrawer-toggle\b/i
];
export const NEXT_ATTRIBUTE_PATTERNS = [/\bnext\b/i, /\bnewer\b/i];
export const NEXT_SHORT_TEXT_PATTERNS = [/^more$/i, /^continue$/i, /^next$/i, /^next page$/i];
export const NEXT_STRONG_ATTRIBUTE_PATTERNS = [
  /^next$/i,
  /^next\b/i,
  /\bnext page\b/i,
  /\bnext video\b/i,
  /\bplay next\b/i,
  /\bskip\b.*\bnext\b/i
];
export const NEXT_FALSE_POSITIVE_PATTERNS = [
  /\bsign\s*in\b/i,
  /\blog\s*in\b/i,
  /\blog\s*on\b/i,
  /\bservice ?login\b/i,
  /\bauth\b/i,
  /\baccount\b/i,
  /\bregister\b/i,
  /\bjoin\b/i
];
export const NOISY_NEXT_CLASS_PATTERNS = [/\byt-spec-button-shape-next\b/i, /\bbutton-next\b/i];
export const PREV_ATTRIBUTE_PATTERNS = [/\bprev\b/i, /\bprevious\b/i, /\bolder\b/i];
export const PREV_SHORT_TEXT_PATTERNS = [/^back$/i, /^previous$/i, /^previous page$/i, /^prev$/i];
export const CANCEL_ATTRIBUTE_PATTERNS = [/\bcancel\b/i, /\bclose\b/i, /\bdismiss\b/i, /\bexit\b/i];
export const CANCEL_SHORT_TEXT_PATTERNS = [/^no$/i, /^nope$/i, /^not now$/i, /^never mind$/i];
export const SUBMIT_ATTRIBUTE_PATTERNS = [
  /\bsubmit\b/i,
  /\bsave\b/i,
  /\bsend\b/i,
  /\bpost\b/i,
  /\bapply\b/i,
  /\bconfirm\b/i,
  /\brepl(?:y|ies)\b/i,
  /\bpublish\b/i
];
export const SUBMIT_SHORT_TEXT_PATTERNS = [/^ok$/i, /^done$/i, /^yes$/i, /^submit$/i, /^reply$/i];
export const LIKE_ATTRIBUTE_PATTERNS = [/\blike\b/i, /\bupvote\b/i, /\bthumb[-_ ]?up\b/i];
export const LIKE_SHORT_TEXT_PATTERNS = [/^like$/i];
export const DISLIKE_ATTRIBUTE_PATTERNS = [/\bdislike\b/i, /\bdownvote\b/i, /\bthumb[-_ ]?down\b/i];
export const DISLIKE_SHORT_TEXT_PATTERNS = [/^dislike$/i];
export const REACTION_WRAPPER_SELECTOR = [
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
export const LIKE_STABLE_CONTROL_PATTERNS = [
  /\bsegmented-start\b/i,
  /\blike-button\b/i,
  /\blikebutton\b/i,
  /\bthumb[-_ ]?up\b/i,
  /\bupvote\b/i
];
export const DISLIKE_STABLE_CONTROL_PATTERNS = [
  /\bsegmented-end\b/i,
  /\bdislike-button\b/i,
  /\bdislikebutton\b/i,
  /\bthumb[-_ ]?down\b/i,
  /\bdownvote\b/i
];
export const HOME_LOGO_PATTERNS = [/\blogo\b/i, /\bbrand\b/i];
export const HOME_PATHS = new Set(["/", "/home", "/homepage", "/dashboard"]);

export type ElementFeatureVector = {
  rect: DOMRect | null;
  isSelectable: boolean;
  textContent?: string;
  joinedAttributeTextCache: Map<string, string>;
  closestCache: Map<string, Element | null>;
};

export type ActionDirectiveOptions = {
  allowFormSignals?: boolean;
  relValues?: string[];
  boostDialogContext?: boolean;
  shortTextPatterns?: readonly RegExp[];
  requireButtonLikeControl?: boolean;
};

export const getBestScoringElementIndex = (
  elements: HTMLElement[],
  threshold: number,
  getScore: (element: HTMLElement, index: number) => number
): number | null => {
  let bestIndex: number | null = null;
  let bestScore = threshold;

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
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

export const getCachedElementTextContent = (
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

export const getCachedElementValueText = (
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

export const getSemanticControlText = (
  element: HTMLElement,
  features?: ElementFeatureVector
): string => {
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

export const isLikelyShortControlText = (value: string): boolean => {
  if (!value || value.length > 24) {
    return false;
  }

  const wordCount = value.split(/\s+/).filter((part) => part.length > 0).length;
  return wordCount > 0 && wordCount <= 4;
};

export const getJoinedAttributeText = (
  element: HTMLElement,
  attributeNames: string[],
  extras: string[] = []
): string =>
  [...attributeNames.map((name) => element.getAttribute(name)), ...extras]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");

export const getCachedJoinedAttributeText = (
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

export const getCachedClosest = (
  element: HTMLElement,
  selector: string,
  features?: ElementFeatureVector
): Element | null => {
  if (!features) {
    return element.closest(selector);
  }

  if (features.closestCache.has(selector)) {
    return features.closestCache.get(selector)!;
  }

  const match = element.closest(selector);
  features.closestCache.set(selector, match);
  return match;
};

export const textMatchesAnyPattern = (text: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

export const isButtonLikeControl = (element: HTMLElement): boolean => {
  if (
    element instanceof HTMLButtonElement ||
    element.getAttribute("role")?.toLowerCase() === "button"
  ) {
    return true;
  }

  if (element.hasAttribute("aria-pressed")) {
    return true;
  }

  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    return type === "button" || type === "submit" || type === "reset" || type === "image";
  }

  return false;
};

export const getReactionControlAttributeText = (
  element: HTMLElement,
  features?: ElementFeatureVector
): string =>
  getCachedJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "data-test-id", "title", "class", "type"],
    [element.tagName.toLowerCase()],
    features
  );

const isAmbiguousReactionWrapper = (element: HTMLElement): boolean => {
  const attributeText = getJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "data-test-id", "title", "class", "type"],
    [element.tagName.toLowerCase()]
  );

  return (
    textMatchesAnyPattern(attributeText, LIKE_ATTRIBUTE_PATTERNS) &&
    textMatchesAnyPattern(attributeText, DISLIKE_ATTRIBUTE_PATTERNS)
  );
};

export const getReactionWrappers = (
  element: HTMLElement,
  features?: ElementFeatureVector
): HTMLElement[] => {
  const wrappers: HTMLElement[] = [];
  let current = getCachedClosest(element, REACTION_WRAPPER_SELECTOR, features);

  while (current instanceof HTMLElement) {
    if (current !== element && !isAmbiguousReactionWrapper(current)) {
      wrappers.push(current);
    }

    current = current.parentElement?.closest(REACTION_WRAPPER_SELECTOR) ?? null;
  }

  return wrappers;
};

export const getReactionSignalText = (
  element: HTMLElement,
  features?: ElementFeatureVector
): string => {
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

export const getNormalizedSameOriginPath = (href: string): string | null => {
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

export const getActiveSelectableBonus = (element: HTMLElement): number =>
  element === getDeepActiveElement() ? 80 : 0;