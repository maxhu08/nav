import {
  ATTACH_ATTRIBUTE_PATTERNS,
  ATTACH_EXACT_CONTROL_PATTERNS,
  ATTACH_FILE_TYPE_PATTERNS,
  INPUT_ATTRIBUTE_PATTERNS,
  PRIMARY_INPUT_ATTRIBUTE_PATTERNS,
  getActiveSelectableBonus,
  getBestScoringElementIndex,
  getCachedClosest,
  getCachedElementTextContent,
  getCachedElementValueText,
  getCachedJoinedAttributeText,
  getHintTargetPreference,
  getMarkerRect,
  isActivatableElement,
  isButtonLikeControl,
  isIntrinsicInteractiveElement,
  isSelectableElement,
  getSemanticControlText,
  textMatchesAnyPattern
} from "~/src/core/utils/hints/directive-recognition/shared";
import type {
  ElementFeatureVector,
  HintDirective
} from "~/src/core/utils/hints/directive-recognition/types";
import {
  getRectGapDistance,
  getRectOverlapRatio,
  isRectCenterNearTarget
} from "~/src/core/utils/hints/directive-recognition/geometry";
import {
  addAreaPenalty,
  addCappedHeightBonus,
  addCappedWidthBonus,
  createScoreAccumulator
} from "~/src/core/utils/hints/directive-recognition/scoring";

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

  const score = createScoreAccumulator(100);
  const attributeText = getCachedJoinedAttributeText(
    element,
    ["type", "name", "id", "placeholder", "aria-label", "data-testid", "role"],
    [],
    features
  );

  if (textMatchesAnyPattern(attributeText, INPUT_ATTRIBUTE_PATTERNS)) {
    score.add(120);
  }

  score.add(getActiveSelectableBonus(element));

  if (
    element instanceof HTMLInputElement &&
    ["search", "text", "email", "url", "tel"].includes(element.type)
  ) {
    score.add(40);
  }

  if (element instanceof HTMLTextAreaElement || element.isContentEditable) {
    score.add(60);
  }

  if (getCachedClosest(element, "search, [role='search'], form", features)) {
    score.add(30);
  }

  addCappedWidthBonus(score, rect, 400, 4);
  addCappedHeightBonus(score, rect, 120, 6);

  return score.finish();
};

const getInputLauncherCandidateScore = (
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

  const semanticControlText = getSemanticControlText(element, features);
  const attributeText = getCachedJoinedAttributeText(
    element,
    [
      "type",
      "name",
      "id",
      "placeholder",
      "aria-label",
      "aria-description",
      "title",
      "data-testid",
      "role",
      "class"
    ],
    [semanticControlText],
    features
  );

  if (!textMatchesAnyPattern(attributeText, INPUT_ATTRIBUTE_PATTERNS)) {
    return Number.NEGATIVE_INFINITY;
  }

  const score = createScoreAccumulator(220);

  if (textMatchesAnyPattern(attributeText, PRIMARY_INPUT_ATTRIBUTE_PATTERNS)) {
    score.add(260);
  }

  if (isButtonLikeControl(element)) {
    score.add(60);
  }

  if (element.hasAttribute("aria-haspopup")) {
    score.add(40);
  }

  if (element.querySelector("kbd") instanceof HTMLElement) {
    score.add(30);
  }

  if (
    getCachedClosest(element, "search, [role='search'], form, header, [role='banner']", features)
  ) {
    score.add(20);
  }

  addCappedWidthBonus(score, rect, 320, 10);
  addCappedHeightBonus(score, rect, 120, 12);

  return score.finish();
};

export const getCombinedInputCandidateScore = (
  element: HTMLElement,
  rectOverride?: DOMRect | null,
  features?: ElementFeatureVector
): number => {
  return Math.max(
    getInputCandidateScore(element, rectOverride, features),
    getInputLauncherCandidateScore(element, rectOverride, features)
  );
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

  const score = createScoreAccumulator(getHintTargetPreference(element));
  const attributeText = getAttachAttributeText(element, features);

  if (textMatchesAnyPattern(attributeText, ATTACH_EXACT_CONTROL_PATTERNS)) {
    score.add(400);
  }

  if (element instanceof HTMLButtonElement) {
    score.add(220);
  }

  if (isIntrinsicInteractiveElement(element)) {
    score.add(140);
  }

  if (element.hasAttribute("aria-haspopup")) {
    score.add(80);
  }

  if (element.hasAttribute("aria-label") || element.hasAttribute("title")) {
    score.add(60);
  }

  addAreaPenalty(score, rect, 400, 20);
  return score.finish();
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

  const score = createScoreAccumulator();
  const attributeText = getAttachAttributeText(element, features);

  if (textMatchesAnyPattern(attributeText, ATTACH_ATTRIBUTE_PATTERNS)) {
    score.addStrong(260);
  }

  if (textMatchesAnyPattern(attributeText, ATTACH_EXACT_CONTROL_PATTERNS)) {
    score.addStrong(240);
  }

  if (textMatchesAnyPattern(attributeText, ATTACH_FILE_TYPE_PATTERNS)) {
    score.add(60);
  }

  if (element instanceof HTMLInputElement && element.type.toLowerCase() === "file") {
    score.addStrong(320);

    if (element.accept) {
      score.add(120);
    }
  }

  if (
    element instanceof HTMLLabelElement &&
    element.control instanceof HTMLInputElement &&
    element.control.type.toLowerCase() === "file"
  ) {
    score.addStrong(340);
  }

  if (getCachedClosest(element, "form", features)) {
    score.add(60);
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLAnchorElement ||
    element instanceof HTMLAreaElement ||
    element.getAttribute("role")?.toLowerCase() === "button"
  ) {
    score.add(40);
  }

  if (element.hasAttribute("aria-haspopup")) {
    score.add(40);
  }

  addCappedWidthBonus(score, rect, 220, 10);
  addCappedHeightBonus(score, rect, 120, 12);

  return score.finish({ requireStrongSignal: true });
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

  let bestSelectableIndex: number | null = null;
  let bestSelectableScore = Number.NEGATIVE_INFINITY;

  elements.forEach((element, index) => {
    const score = getInputCandidateScore(element);
    if (score > bestSelectableScore) {
      bestSelectableScore = score;
      bestSelectableIndex = index;
    }
  });

  let bestLauncherIndex: number | null = null;
  let bestLauncherScore = Number.NEGATIVE_INFINITY;

  elements.forEach((element, index) => {
    const score = getInputLauncherCandidateScore(element);
    if (score > bestLauncherScore) {
      bestLauncherScore = score;
      bestLauncherIndex = index;
    }
  });

  if (bestLauncherScore >= 220 && bestLauncherScore >= bestSelectableScore + 80) {
    return bestLauncherIndex;
  }

  if (bestSelectableScore >= 180) {
    return bestSelectableIndex;
  }

  return bestLauncherScore >= 220 ? bestLauncherIndex : null;
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