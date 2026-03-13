import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";

const PREVIOUS_PATTERNS = ["prev", "previous", "back", "older", "<", "‹", "←", "«", "≪", "<<"];
const NEXT_PATTERNS = ["next", "more", "newer", ">", "›", "→", "»", "≫", ">>"];

type Candidate = {
  element: Element;
  texts: string[];
  wordCount: number;
  originalIndex: number;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasWordBoundary = (pattern: string): boolean => {
  const first = pattern[0] ?? "";
  const last = pattern[pattern.length - 1] ?? "";
  return /\w/.test(first) || /\w/.test(last);
};

const isVisible = (element: Element): boolean => {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const getCandidateTexts = (element: Element): string[] => {
  const directTextContent = [
    element instanceof HTMLElement ? element.innerText : null,
    element.textContent,
    element instanceof HTMLInputElement ? element.value : null,
    element.getAttribute("title"),
    element.getAttribute("aria-label")
  ];

  const nestedInteractiveTextContent =
    element instanceof HTMLElement
      ? Array.from(
          element.querySelectorAll<HTMLElement>(
            "button, a, [role='button'], [role='link'], [aria-label], [title]"
          )
        )
          .slice(0, 8)
          .flatMap((nestedElement) => [
            nestedElement.innerText,
            nestedElement.textContent,
            nestedElement.getAttribute("title"),
            nestedElement.getAttribute("aria-label")
          ])
      : [];

  return [...directTextContent, ...nestedInteractiveTextContent]
    .map((value) => value?.trim().toLowerCase() ?? "")
    .filter((value) => value.length > 0);
};

const getWordCount = (texts: string[]): number => {
  const primaryText = texts[0] ?? "";
  const words = primaryText.split(/\s+/).filter((word) => word.length > 0);
  return words.length || Number.MAX_SAFE_INTEGER;
};

const findElementWithRel = (relValue: "prev" | "next"): Element | null => {
  const elements = document.querySelectorAll("link[rel], a[rel], area[rel]");

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];

    if (!element) {
      continue;
    }

    const rel = element.getAttribute("rel") ?? "";
    const relValues = rel
      .toLowerCase()
      .split(/\s+/)
      .filter((value: string) => value.length > 0);

    if (relValues.includes(relValue)) {
      return element;
    }
  }

  return null;
};

const findMatchingLink = (patterns: readonly string[]): Element | null => {
  const candidates: Candidate[] = [];
  const elements = document.querySelectorAll(
    "a, area, button, input[type='button'], input[type='submit'], input[type='image'], *[onclick], *[role='link'], *[role='button'], *[aria-label], *[title], *[class*='button'], yt-button-shape"
  );

  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];

    if (!element || !isVisible(element)) {
      continue;
    }

    const texts = getCandidateTexts(element);

    if (texts.length === 0) {
      continue;
    }

    const hasPatternMatch = patterns.some((pattern) =>
      texts.some((text) => text.includes(pattern))
    );

    if (!hasPatternMatch) {
      continue;
    }

    candidates.push({
      element,
      texts,
      wordCount: getWordCount(texts),
      originalIndex: candidates.length
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  const sortedCandidates = candidates
    .sort((a, b) => {
      if (a.wordCount === b.wordCount) {
        return a.originalIndex - b.originalIndex;
      }

      return a.wordCount - b.wordCount;
    })
    .filter((candidate, _, allCandidates) => {
      const shortestWordCount = allCandidates[0]?.wordCount ?? Number.MAX_SAFE_INTEGER;
      return candidate.wordCount <= shortestWordCount + 1;
    });

  for (const pattern of patterns) {
    const expression = hasWordBoundary(pattern)
      ? new RegExp(`\\b${escapeRegExp(pattern)}\\b`, "i")
      : new RegExp(escapeRegExp(pattern), "i");

    for (const candidate of sortedCandidates) {
      if (candidate.texts.some((text) => expression.test(text))) {
        return candidate.element;
      }
    }
  }

  return null;
};

const resolveActionableElement = (element: Element): Element => {
  if (!(element instanceof HTMLElement)) {
    return element;
  }

  const actionableSelector =
    "a, area, button, input[type='button'], input[type='submit'], input[type='image'], [role='button'], [role='link'], [onclick]";

  const closestActionable = element.closest(actionableSelector);
  if (closestActionable) {
    return closestActionable;
  }

  const nestedActionable = element.querySelector(actionableSelector);
  return nestedActionable ?? element;
};

const dispatchFocusIndicator = (element: HTMLElement): void => {
  window.dispatchEvent(
    new CustomEvent(FOCUS_INDICATOR_EVENT, {
      detail: { element }
    })
  );
};

const followElement = (element: Element): boolean => {
  const actionableElement = resolveActionableElement(element);

  if (actionableElement instanceof HTMLLinkElement && actionableElement.href) {
    dispatchFocusIndicator(actionableElement);
    window.location.assign(actionableElement.href);
    return true;
  }

  if (actionableElement instanceof HTMLElement) {
    dispatchFocusIndicator(actionableElement);
    actionableElement.scrollIntoView({ block: "nearest", inline: "nearest" });
    actionableElement.click();
    return true;
  }

  if ("click" in actionableElement && typeof actionableElement.click === "function") {
    actionableElement.click();
    return true;
  }

  return false;
};

const followDirection = (rel: "prev" | "next", patterns: readonly string[]): boolean => {
  const target = findElementWithRel(rel) ?? findMatchingLink(patterns);

  if (!target) {
    return false;
  }

  return followElement(target);
};

export const followPreviousPage = (): boolean => followDirection("prev", PREVIOUS_PATTERNS);
export const followNextPage = (): boolean => followDirection("next", NEXT_PATTERNS);