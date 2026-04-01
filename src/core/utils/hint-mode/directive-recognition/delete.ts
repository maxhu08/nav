import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const DELETE_TOKEN_PATTERN = /\b(delete|remove|trash|discard|clear)\b/i;

export const scoreDeleteDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  return getPatternScore(getActionDescriptorText(element), DELETE_TOKEN_PATTERN, 18);
};