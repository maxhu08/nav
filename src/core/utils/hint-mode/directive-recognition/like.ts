import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const LIKE_TOKEN_PATTERN = /\b(like|upvote|thumbs\s*up|favorite|favourite)\b/i;

export const scoreLikeDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  return getPatternScore(getActionDescriptorText(element), LIKE_TOKEN_PATTERN, 18);
};