import {
  ATTACH_ATTRIBUTE_PATTERNS,
  ATTACH_EXACT_CONTROL_PATTERNS,
  ATTACH_FILE_TYPE_PATTERNS,
  INPUT_ATTRIBUTE_PATTERNS,
  getActiveSelectableBonus,
  getBestScoringElementIndex,
  getCachedClosest,
  getCachedElementTextContent,
  getCachedElementValueText,
  getCachedJoinedAttributeText,
  getHintTargetPreference,
  getMarkerRect,
  isActivatableElement,
  isIntrinsicInteractiveElement,
  isSelectableElement,
  textMatchesAnyPattern,
  type ElementFeatureVector,
  type HintDirective
} from "~/src/core/utils/hints/directive-recognition/shared";

export const getInputCandidateScore = (
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

  score += getActiveSelectableBonus(element);

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

export const getAttachCandidateScore = (
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

export const getRectOverlapRatio = (leftRect: DOMRect, rightRect: DOMRect): number => {
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

export const isRectCenterNearTarget = (
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

export const remapAttachDirectiveIndex = (
  elements: HTMLElement[],
  attachIndex: number,
  getRect: (element: HTMLElement) => DOMRect | null
): number => {
  const attachElement = elements[attachIndex];

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
    if (!isSelectableElement(element)) {
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

export const getAttachEquivalentIndexes = (
  elements: HTMLElement[],
  attachIndex: number
): number[] => {
  const attachElement = elements[attachIndex];

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