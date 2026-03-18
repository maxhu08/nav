import {
  CANCEL_ATTRIBUTE_PATTERNS,
  CANCEL_SHORT_TEXT_PATTERNS,
  DISLIKE_ATTRIBUTE_PATTERNS,
  DISLIKE_SHORT_TEXT_PATTERNS,
  DISLIKE_STABLE_CONTROL_PATTERNS,
  DOWNLOAD_ATTRIBUTE_PATTERNS,
  DOWNLOAD_SHORT_TEXT_PATTERNS,
  LIKE_ATTRIBUTE_PATTERNS,
  LIKE_SHORT_TEXT_PATTERNS,
  LIKE_STABLE_CONTROL_PATTERNS,
  LOGIN_ATTRIBUTE_PATTERNS,
  LOGIN_SHORT_TEXT_PATTERNS,
  NEXT_ATTRIBUTE_PATTERNS,
  NEXT_FALSE_POSITIVE_PATTERNS,
  NEXT_SHORT_TEXT_PATTERNS,
  NEXT_STRONG_ATTRIBUTE_PATTERNS,
  NOISY_NEXT_CLASS_PATTERNS,
  PREV_ATTRIBUTE_PATTERNS,
  PREV_SHORT_TEXT_PATTERNS,
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
  getDislikeCandidateScore,
  getLikeCandidateScore,
  getNextCandidateScore
};