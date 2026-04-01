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
const GENERIC_ACTION_MENU_PATTERN = /\b(more actions|more options|options|overflow|menu)\b/i;
const MAX_DIRECTIVE_SCORE = 9999;

export const scoreAttachDirectiveCandidate = (element: HTMLElement): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const testId = element.getAttribute("data-testid")?.toLowerCase();
  const id = element.id.toLowerCase();
  const ariaLabel = element.getAttribute("aria-label")?.trim().toLowerCase();

  if (
    (testId === "composer-plus-btn" || id === "composer-plus-btn") &&
    ariaLabel === "add files and more"
  ) {
    return MAX_DIRECTIVE_SCORE;
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
  const labelText = getJoinedElementText(
    getElementTextValues(element, ["aria-label", "title", "aria-description", "data-tooltip"])
  );

  if (GENERIC_ACTION_MENU_PATTERN.test(labelText) && !COMPOSER_PLUS_PATTERN.test(descriptorText)) {
    return 0;
  }

  const fileInputScore =
    element instanceof HTMLInputElement && element.type.toLowerCase() === "file" ? 12 : 0;
  const semanticScore = getPatternScore(descriptorText, ATTACH_TOKEN_PATTERN, 16);
  const composerPlusScore = getPatternScore(descriptorText, COMPOSER_PLUS_PATTERN, 10);

  return semanticScore + composerPlusScore + fileInputScore;
};