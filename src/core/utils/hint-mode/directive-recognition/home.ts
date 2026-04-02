import { getPatternScore } from "~/src/core/utils/hint-mode/directive-recognition/shared";

const HOME_TOKEN_PATTERN = /\bhome(?:page)?\b/i;
const ROOT_PATH_PATTERN = /^\/$/;
const HOME_PATH_PATTERN = /^\/home\/?$/i;

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

export const scoreHomeDirectiveCandidate = (element: HTMLElement): number => {
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