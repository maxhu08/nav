import {
  getAncestorDescriptorText,
  getElementTextValues,
  getJoinedElementText,
  getPatternScore,
  isButtonLikeDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const ATTACH_TOKEN_PATTERN =
  /\b(attach|upload|paperclip|files?|image|photo|add files?|add attachment|attachments?)\b/i;
const COMPOSER_PLUS_PATTERN = /\bcomposer[-\s]?plus\b/i;

export const scoreAttachDirectiveCandidate = (element: HTMLElement): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "aria-description",
      "data-tooltip",
      "data-testid",
      "id",
      "class",
      "name",
      "type"
    ]),
    element.textContent,
    getAncestorDescriptorText(element)
  ]);
  const fileInputScore =
    element instanceof HTMLInputElement && element.type.toLowerCase() === "file" ? 12 : 0;
  const semanticScore = getPatternScore(descriptorText, ATTACH_TOKEN_PATTERN, 16);
  const composerPlusScore = getPatternScore(descriptorText, COMPOSER_PLUS_PATTERN, 10);

  return semanticScore + composerPlusScore + fileInputScore;
};