import {
  getElementTextValues,
  getJoinedElementText,
  getPatternScore,
  isEditableInputCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const INPUT_TOKEN_PATTERN =
  /\b(search|chat|message|prompt|query|reply|ask|compose|composer|write|type|input|textbox|searchbox|editor|command)\b/i;
const CHAT_INPUT_TOKEN_PATTERN =
  /\b(chat|message|prompt|reply|ask|compose|composer|write|editor|command)\b/i;

export const scoreInputDirectiveCandidate = (element: HTMLElement): number => {
  if (!isEditableInputCandidate(element)) {
    return 0;
  }

  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "placeholder",
      "aria-placeholder",
      "data-placeholder",
      "name",
      "id",
      "class",
      "role",
      "type"
    ]),
    element.textContent
  ]);
  const placeholderText = getJoinedElementText(
    getElementTextValues(element, [
      "placeholder",
      "aria-placeholder",
      "data-placeholder",
      "aria-label"
    ])
  );
  const semanticScore = Math.max(
    getPatternScore(placeholderText, INPUT_TOKEN_PATTERN, 16),
    getPatternScore(descriptorText, INPUT_TOKEN_PATTERN, 12)
  );
  const chatComposerScore = getPatternScore(descriptorText, CHAT_INPUT_TOKEN_PATTERN, 8);
  const typeScore =
    element instanceof HTMLTextAreaElement
      ? 7
      : element instanceof HTMLInputElement
        ? element.type.toLowerCase() === "search"
          ? 10
          : 4
        : element.isContentEditable
          ? 9
          : 6;
  const parentContext = getJoinedElementText([
    element.closest("form,[role='search'],header,main,aside,nav,section")?.getAttribute("class"),
    element.closest("form,[role='search'],header,main,aside,nav,section")?.getAttribute("id")
  ]);
  const contextScore = INPUT_TOKEN_PATTERN.test(parentContext) ? 4 : 0;

  return semanticScore > 0
    ? semanticScore + chatComposerScore + typeScore + contextScore
    : typeScore >= 7
      ? typeScore
      : 0;
};