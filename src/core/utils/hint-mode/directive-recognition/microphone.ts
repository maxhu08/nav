import {
  getActionOwnDescriptorText,
  getPatternScore,
  isButtonLikeDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const MICROPHONE_TOKEN_PATTERN =
  /\b(microphone|mic|voice|audio|record|dictate|dictation|speech)\b/i;

export const scoreMicrophoneDirectiveCandidate = (
  element: HTMLElement,
  descriptor?: string
): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const descriptorText = descriptor ?? getActionOwnDescriptorText(element);

  return getPatternScore(descriptorText, MICROPHONE_TOKEN_PATTERN, 18);
};