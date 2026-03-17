import {
  HOME_ATTRIBUTE_PATTERNS,
  HOME_LOGO_PATTERNS,
  HOME_PATHS,
  SIDEBAR_ATTRIBUTE_PATTERNS,
  SIDEBAR_CONTAINER_PATTERNS,
  SIDEBAR_NON_NAVIGATION_PATTERNS,
  SIDEBAR_OPEN_CLOSE_PATTERNS,
  SIDEBAR_TOGGLE_PATTERNS,
  getBestScoringElementIndex,
  getCachedClosest,
  getCachedElementTextContent,
  getCachedJoinedAttributeText,
  getJoinedAttributeText,
  getMarkerRect,
  hasInteractiveRole,
  isActivatableElement,
  isSelectableElement,
  textMatchesAnyPattern,
  type ElementFeatureVector
} from "~/src/core/utils/hints/directive-recognition/shared";
import { getNormalizedSameOriginPath } from "~/src/core/utils/hints/directive-recognition/shared";

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

export const getSidebarControlsSignalScore = (element: HTMLElement): number => {
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

export { getHomeCandidateScore, getSidebarCandidateScore };