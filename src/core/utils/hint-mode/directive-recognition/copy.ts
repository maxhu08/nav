import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const COPY_TOKEN_PATTERN = /\b(copy|duplicate|clone|clipboard)\b/i;
const MAX_DIRECTIVE_SCORE = 9999;

export const scoreCopyDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  const ariaLabel = element.getAttribute("aria-label")?.trim().toLowerCase();
  const testId = element.getAttribute("data-testid")?.trim().toLowerCase();

  if (testId === "copy-turn-action-button") {
    if (ariaLabel === "copy response") {
      return MAX_DIRECTIVE_SCORE;
    }

    if (ariaLabel === "copy message") {
      return MAX_DIRECTIVE_SCORE - 1;
    }
  }

  return getPatternScore(getActionDescriptorText(element), COPY_TOKEN_PATTERN, 18);
};