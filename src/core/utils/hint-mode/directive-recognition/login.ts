import {
  getActionDescriptorText,
  getAnchorPathScore,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const LOGIN_TOKEN_PATTERN =
  /\b(log\s*in|login|sign\s*in|signin|sign\s*up|signup|authenticate|auth)\b/i;
const LOGIN_PATH_PATTERN = /^\/(login|log-in|signin|sign-in|signup|sign-up|auth)(?:\/|$)/i;

export const scoreLoginDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  const descriptorText = getActionDescriptorText(element);

  return (
    getPatternScore(descriptorText, LOGIN_TOKEN_PATTERN, 18) +
    getAnchorPathScore(element, LOGIN_PATH_PATTERN, 10)
  );
};