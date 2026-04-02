import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const CHAT_TOKEN_PATTERN =
  /\b(chat|chats|message|messages|messaging|conversation|conversations|assistant)\b/i;

export const scoreChatDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  return getPatternScore(getActionDescriptorText(element), CHAT_TOKEN_PATTERN, 18);
};