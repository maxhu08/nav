import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const COMMENT_TOKEN_PATTERN =
  /\b(comment|comments|reply|replies|discussion|discussions|thread|threads|respond|response)\b/i;

export const scoreCommentDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  return getPatternScore(getActionDescriptorText(element), COMMENT_TOKEN_PATTERN, 18);
};