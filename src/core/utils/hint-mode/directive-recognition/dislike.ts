import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const DISLIKE_TOKEN_PATTERN = /\b(dislike|downvote|thumbs\s*down)\b/i;

export const scoreDislikeDirectiveCandidate = (
  element: HTMLElement,
  descriptor?: string
): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  return getPatternScore(descriptor ?? getActionDescriptorText(element), DISLIKE_TOKEN_PATTERN, 18);
};