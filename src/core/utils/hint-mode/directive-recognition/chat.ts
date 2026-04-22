import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const CHAT_TOKEN_PATTERN =
  /\b(chat|chats|message|messages|messaging|conversation|conversations|assistant)\b/i;
const MAX_DIRECTIVE_SCORE = 9999;

const isYouTubeAskButton = (element: HTMLElement): boolean => {
  if (!element.matches("button-view-model.you-chat-entrypoint-button > button")) {
    return false;
  }

  return element.getAttribute("aria-label")?.trim().toLowerCase() === "ask";
};

export const scoreChatDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  if (isYouTubeAskButton(element)) {
    return MAX_DIRECTIVE_SCORE;
  }

  return getPatternScore(getActionDescriptorText(element), CHAT_TOKEN_PATTERN, 18);
};