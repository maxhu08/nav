import {
  CANCEL_ATTRIBUTE_PATTERNS,
  CANCEL_SHORT_TEXT_PATTERNS,
  COPY_ATTRIBUTE_PATTERNS,
  COPY_SHORT_TEXT_PATTERNS,
  DISLIKE_ATTRIBUTE_PATTERNS,
  DISLIKE_SHORT_TEXT_PATTERNS,
  DISLIKE_STABLE_CONTROL_PATTERNS,
  DOWNLOAD_ATTRIBUTE_PATTERNS,
  DOWNLOAD_SHORT_TEXT_PATTERNS,
  HIDE_ATTRIBUTE_PATTERNS,
  HIDE_CLOSE_CONTROL_PATTERNS,
  HIDE_CONTAINER_PATTERNS,
  LIKE_ATTRIBUTE_PATTERNS,
  LIKE_SHORT_TEXT_PATTERNS,
  LIKE_STABLE_CONTROL_PATTERNS,
  LOGIN_ATTRIBUTE_PATTERNS,
  LOGIN_SHORT_TEXT_PATTERNS,
  MICROPHONE_ATTRIBUTE_PATTERNS,
  MICROPHONE_STRONG_ATTRIBUTE_PATTERNS,
  MICROPHONE_SHORT_TEXT_PATTERNS,
  NEXT_ATTRIBUTE_PATTERNS,
  NEXT_FALSE_POSITIVE_PATTERNS,
  NEXT_SHORT_TEXT_PATTERNS,
  NEXT_STRONG_ATTRIBUTE_PATTERNS,
  NOISY_NEXT_CLASS_PATTERNS,
  NOTIFICATION_ATTRIBUTE_PATTERNS,
  NOTIFICATION_SHORT_TEXT_PATTERNS,
  PREV_ATTRIBUTE_PATTERNS,
  PREV_SHORT_TEXT_PATTERNS,
  POPUP_DIALOG_SELECTOR,
  SAVE_ATTRIBUTE_PATTERNS,
  SAVE_SHORT_TEXT_PATTERNS,
  SHARE_ATTRIBUTE_PATTERNS,
  SHARE_SHORT_TEXT_PATTERNS,
  SIDEBAR_CONTAINER_PATTERNS,
  SUBMIT_ATTRIBUTE_PATTERNS,
  SUBMIT_SHORT_TEXT_PATTERNS,
  getBestScoringElementIndex,
  getCachedClosest,
  getCachedElementTextContent,
  getCachedJoinedAttributeText,
  getMarkerRect,
  getNormalizedSameOriginPath,
  getReactionSignalText,
  getReactionWrappers,
  getSemanticControlText,
  isActivatableElement,
  isButtonLikeControl,
  isLikelyShortControlText,
  isSelectableElement,
  textMatchesAnyPattern,
  type ActionDirectiveOptions,
  type ElementFeatureVector
} from "~/src/core/utils/hints/directive-recognition/shared";
import { getSidebarControlsSignalScore } from "~/src/core/utils/hints/directive-recognition/home-sidebar";

const SAVE_NAVIGATION_CONTAINER_SELECTOR = [
  "nav",
  "[role='navigation']",
  "ytd-guide-entry-renderer",
  "ytd-guide-section-renderer",
  "[class*='guide-entry' i]",
  "[class*='guide' i]"
].join(", ");
const ACTION_STRUCTURAL_ATTRIBUTE_NAMES = [
  "name",
  "id",
  "data-testid",
  "data-test-id",
  "role",
  "class",
  "type"
];
const ACTION_SEMANTIC_ATTRIBUTE_NAMES = ["aria-label", "aria-description", "title", "value"];
const NOTIFICATION_PATH_PATTERNS = [
  /^\/notifications?(?:\/|$)/i,
  /^\/inbox(?:\/|$)/i,
  /^\/updates(?:\/|$)/i,
  /^\/alerts?(?:\/|$)/i
];

const hasShortMatchingActionSemanticAttribute = (
  element: HTMLElement,
  patterns: readonly RegExp[]
): boolean => {
  return ACTION_SEMANTIC_ATTRIBUTE_NAMES.some((attributeName) => {
    const value = element.getAttribute(attributeName)?.replace(/\s+/g, " ").trim() ?? "";
    return isLikelyShortControlText(value) && textMatchesAnyPattern(value, patterns);
  });
};

const isWatchLaterNavigationLink = (
  element: HTMLElement,
  features?: ElementFeatureVector
): boolean => {
  const linkLikeElement =
    element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement
      ? element
      : element.closest("a[href], area[href]");

  if (
    !(linkLikeElement instanceof HTMLAnchorElement || linkLikeElement instanceof HTMLAreaElement)
  ) {
    return false;
  }

  const href = linkLikeElement.getAttribute("href");
  if (!href || getNormalizedSameOriginPath(href) !== "/playlist") {
    return false;
  }

  let isWatchLaterHref = false;

  try {
    const resolvedUrl = new URL(href, window.location.href);
    isWatchLaterHref =
      resolvedUrl.origin === window.location.origin &&
      resolvedUrl.searchParams.get("list") === "WL";
  } catch {
    return false;
  }

  if (!isWatchLaterHref) {
    return false;
  }

  const attributeText = getCachedJoinedAttributeText(
    linkLikeElement,
    ["aria-label", "title", "id", "class", "role"],
    [getSemanticControlText(linkLikeElement, features), getSemanticControlText(element, features)],
    features
  );

  return (
    /\bwatch[-_ ]?later\b/i.test(attributeText) &&
    (getCachedClosest(linkLikeElement, SAVE_NAVIGATION_CONTAINER_SELECTOR, features) instanceof
      HTMLElement ||
      getCachedClosest(element, SAVE_NAVIGATION_CONTAINER_SELECTOR, features) instanceof
        HTMLElement)
  );
};

export const getActionDirectiveCandidateScore = (
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

  if (options.requireButtonLikeControl && !isButtonLikeControl(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const semanticControlText = getSemanticControlText(element, features);
  const structuralAttributeText = getCachedJoinedAttributeText(
    element,
    ACTION_STRUCTURAL_ATTRIBUTE_NAMES,
    [],
    features
  );

  if (textMatchesAnyPattern(structuralAttributeText, patterns)) {
    score += 240;
    hasStrongSignal = true;
  }

  if (hasShortMatchingActionSemanticAttribute(element, patterns)) {
    score += 220;
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

const getLargestContainedPopup = (
  element: HTMLElement,
  features?: ElementFeatureVector
): HTMLElement | null => {
  const containerRect = features?.rect ?? getMarkerRect(element);
  if (!containerRect) {
    return null;
  }

  let bestPopup: HTMLElement | null = null;
  let bestArea = 0;

  for (const candidate of element.querySelectorAll<HTMLElement>(POPUP_DIALOG_SELECTOR)) {
    if (candidate === element) {
      continue;
    }

    const rect = getMarkerRect(candidate);
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    if (
      rect.width > containerRect.width ||
      rect.height > containerRect.height ||
      rect.left < containerRect.left ||
      rect.top < containerRect.top ||
      rect.right > containerRect.right ||
      rect.bottom > containerRect.bottom
    ) {
      continue;
    }

    const area = rect.width * rect.height;
    if (area > bestArea) {
      bestArea = area;
      bestPopup = candidate;
    }
  }

  return bestPopup;
};

const hasPopupDismissControl = (popup: HTMLElement): boolean => {
  for (const control of popup.querySelectorAll<HTMLElement>(
    "button, [role='button'], a[href], input:not([type='hidden']), summary, [tabindex], [onclick], [jsaction]"
  )) {
    const attributeText = getCachedJoinedAttributeText(
      control,
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
      [getSemanticControlText(control)],
      undefined
    );

    if (textMatchesAnyPattern(attributeText, HIDE_CLOSE_CONTROL_PATTERNS)) {
      return true;
    }
  }

  return false;
};

const getHideCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect || rect.width < 120 || rect.height < 80) {
    return Number.NEGATIVE_INFINITY;
  }

  const popup = getLargestContainedPopup(element, {
    rect,
    isSelectable: features?.isSelectable ?? isSelectableElement(element),
    textContent: features?.textContent,
    joinedAttributeTextCache: features?.joinedAttributeTextCache ?? new Map(),
    closestCache: features?.closestCache ?? new Map()
  });
  if (!popup) {
    return Number.NEGATIVE_INFINITY;
  }

  if (hasPopupDismissControl(popup)) {
    return Number.NEGATIVE_INFINITY;
  }

  const popupRect = getMarkerRect(popup);
  if (!popupRect) {
    return Number.NEGATIVE_INFINITY;
  }

  const containerArea = rect.width * rect.height;
  const popupArea = popupRect.width * popupRect.height;
  if (containerArea <= popupArea * 1.2) {
    return Number.NEGATIVE_INFINITY;
  }

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
      "class"
    ],
    [getSemanticControlText(element)],
    features
  );
  const popupAttributeText = getCachedJoinedAttributeText(
    popup,
    [
      "name",
      "id",
      "aria-label",
      "aria-description",
      "data-testid",
      "data-test-id",
      "role",
      "title",
      "class"
    ],
    [getSemanticControlText(popup)],
    undefined
  );

  let score = 200;

  if (textMatchesAnyPattern(attributeText, HIDE_CONTAINER_PATTERNS)) {
    score += 120;
  }

  if (textMatchesAnyPattern(attributeText, HIDE_ATTRIBUTE_PATTERNS)) {
    score += 80;
  }

  if (textMatchesAnyPattern(popupAttributeText, HIDE_ATTRIBUTE_PATTERNS)) {
    score += 70;
  }

  if (popup.parentElement === element) {
    score += 40;
  }

  if (!isActivatableElement(element)) {
    score += 40;
  }

  score += Math.min(240, rect.width) / 8;
  score += Math.min(240, rect.height) / 10;

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

  const attributeText = getReactionSignalText(element, features);
  const hasStableSignal = textMatchesAnyPattern(attributeText, controlPatterns);
  const hasSiblingSignal = hasReactionSiblingSignal(element, siblingPatterns, features);

  if (!hasStableSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 200;

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
        requireButtonLikeControl: true,
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
        requireButtonLikeControl: true,
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

const getMicrophoneCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  const score = getActionDirectiveCandidateScore(
    element,
    MICROPHONE_ATTRIBUTE_PATTERNS,
    {
      requireButtonLikeControl: true,
      shortTextPatterns: MICROPHONE_SHORT_TEXT_PATTERNS
    },
    rectOverride,
    features
  );

  if (score === Number.NEGATIVE_INFINITY) {
    return score;
  }

  const attributeText = getCachedJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "data-test-id", "title", "class", "type"],
    [getSemanticControlText(element, features)],
    features
  );

  return textMatchesAnyPattern(attributeText, MICROPHONE_STRONG_ATTRIBUTE_PATTERNS)
    ? score + 160
    : score;
};

const getNotificationCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  const score = getActionDirectiveCandidateScore(
    element,
    NOTIFICATION_ATTRIBUTE_PATTERNS,
    {
      shortTextPatterns: NOTIFICATION_SHORT_TEXT_PATTERNS
    },
    rectOverride,
    features
  );

  const linkLikeElement =
    element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement
      ? element
      : element.closest("a[href], area[href]");

  if (
    !(linkLikeElement instanceof HTMLAnchorElement || linkLikeElement instanceof HTMLAreaElement)
  ) {
    return score;
  }

  const href = linkLikeElement.getAttribute("href");
  const normalizedPath = href ? getNormalizedSameOriginPath(href) : null;
  if (
    !normalizedPath ||
    !NOTIFICATION_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath))
  ) {
    return score;
  }

  let boostedScore = score === Number.NEGATIVE_INFINITY ? 20 : score;
  boostedScore += 260;

  if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
    boostedScore += 40;
  }

  if ((element.getAttribute("aria-haspopup") ?? "").toLowerCase() === "true") {
    boostedScore += 20;
  }

  return boostedScore;
};

const getSaveCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  if (isWatchLaterNavigationLink(element, features)) {
    return Number.NEGATIVE_INFINITY;
  }

  return getActionDirectiveCandidateScore(
    element,
    SAVE_ATTRIBUTE_PATTERNS,
    {
      shortTextPatterns: SAVE_SHORT_TEXT_PATTERNS
    },
    rectOverride,
    features
  );
};

const getCopyCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  const score = getActionDirectiveCandidateScore(
    element,
    COPY_ATTRIBUTE_PATTERNS,
    {
      shortTextPatterns: COPY_SHORT_TEXT_PATTERNS
    },
    rectOverride,
    features
  );

  if (score === Number.NEGATIVE_INFINITY) {
    return score;
  }

  let boostedScore = score;
  const attributeText = getCachedJoinedAttributeText(
    element,
    ["aria-label", "title", "data-testid", "data-test-id", "class", "name"],
    [getSemanticControlText(element, features)],
    features
  );

  if (/\bcopy response\b/i.test(attributeText)) {
    boostedScore += 180;
  }

  if (/\bcopy[-_ ]?turn[-_ ]?action[-_ ]?button\b/i.test(attributeText)) {
    boostedScore += 180;
  }

  if (
    getCachedClosest(
      element,
      "[aria-label='Response actions'], [aria-label*='actions' i][role='group']",
      features
    )
  ) {
    boostedScore += 140;
  }

  return boostedScore;
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

export const getPreferredShareElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, SHARE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: SHARE_SHORT_TEXT_PATTERNS
  });

export const getPreferredDownloadElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, DOWNLOAD_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: DOWNLOAD_SHORT_TEXT_PATTERNS
  });

export const getPreferredLoginElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, LOGIN_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: LOGIN_SHORT_TEXT_PATTERNS
  });

export const getPreferredMicrophoneElementIndex = (elements: HTMLElement[]): number | null =>
  getBestScoringElementIndex(elements, 220, (element) => getMicrophoneCandidateScore(element));

export const getPreferredNotificationElementIndex = (elements: HTMLElement[]): number | null =>
  getBestScoringElementIndex(elements, 220, (element) => getNotificationCandidateScore(element));

export const getPreferredSaveElementIndex = (elements: HTMLElement[]): number | null =>
  getBestScoringElementIndex(elements, 220, (element) => getSaveCandidateScore(element));

export const getPreferredCopyElementIndex = (elements: HTMLElement[]): number | null =>
  getBestScoringElementIndex(elements, 220, (element) => getCopyCandidateScore(element));

export const getPreferredHideElementIndex = (elements: HTMLElement[]): number | null =>
  getBestScoringElementIndex(elements, 240, (element) => getHideCandidateScore(element));

export const getPreferredLikeElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, LIKE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: LIKE_SHORT_TEXT_PATTERNS
  });

export const getPreferredDislikeElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, DISLIKE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: DISLIKE_SHORT_TEXT_PATTERNS
  });

export {
  getCancelCandidateScore,
  getCopyCandidateScore,
  getPreferredActionDirectiveElementIndex,
  getDislikeCandidateScore,
  getHideCandidateScore,
  getLikeCandidateScore,
  getMicrophoneCandidateScore,
  getNextCandidateScore,
  getNotificationCandidateScore,
  getSaveCandidateScore
};