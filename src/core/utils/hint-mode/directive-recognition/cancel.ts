import {
  getElementTextValues,
  getJoinedElementText,
  getActionDescriptorText,
  getPatternScore,
  isButtonLikeDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const CANCEL_TOKEN_PATTERN = /\b(cancel|close|dismiss|never mind)\b/i;
const SIDEBAR_CONTEXT_PATTERN = /\b(sidebar|drawer|slideover|panel|navigation|nav)\b/i;

export const scoreCancelDirectiveCandidate = (element: HTMLElement): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const sidebarContext = getJoinedElementText([
    ...getElementTextValues(element, ["aria-controls", "data-testid", "id", "class"]),
    element.closest("header,aside,nav,[id],[class]")?.getAttribute("id"),
    element.closest("header,aside,nav,[id],[class]")?.getAttribute("class")
  ]);

  if (SIDEBAR_CONTEXT_PATTERN.test(sidebarContext)) {
    return 0;
  }

  return getPatternScore(getActionDescriptorText(element), CANCEL_TOKEN_PATTERN, 18);
};