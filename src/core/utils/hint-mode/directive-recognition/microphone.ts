import {
  getAncestorDescriptorText,
  getElementTextValues,
  getJoinedElementText,
  getPatternScore,
  isButtonLikeDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const MICROPHONE_TOKEN_PATTERN = /\b(microphone|mic|voice|audio|record|dictate|speech)\b/i;

export const scoreMicrophoneDirectiveCandidate = (element: HTMLElement): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "aria-description",
      "data-tooltip",
      "id",
      "class",
      "name"
    ]),
    element.textContent,
    getAncestorDescriptorText(element)
  ]);

  return getPatternScore(descriptorText, MICROPHONE_TOKEN_PATTERN, 18);
};