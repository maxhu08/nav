import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

const isChatGptComposerTarget = (element: HTMLElement): boolean => {
  const composerSurface = element.closest(
    "form[data-type='unified-composer'] [data-composer-surface='true']"
  );

  if (!composerSurface) {
    return false;
  }

  return (
    element.matches("#composer-plus-btn[aria-label='Add files and more']") ||
    element.matches(
      "#prompt-textarea.ProseMirror[role='textbox'][aria-label='Chat with ChatGPT']"
    ) ||
    element.matches("button[aria-label='Start dictation']") ||
    element.matches("button[aria-label='Start Voice']") ||
    element.matches("button[data-testid='send-button']") ||
    element.matches("button[aria-label='Send prompt']")
  );
};

const isChatGptResponseActionTarget = (element: HTMLElement): boolean => {
  const responseActions = element.closest("[aria-label='Response actions'][role='group']");

  if (!responseActions) {
    return false;
  }

  return element.matches("button") || element.matches("button *");
};

export const getChatGptSpecialRowKey = (target: HintTarget): string | null => {
  if (isChatGptComposerTarget(target.element)) {
    return "chatgpt-composer";
  }

  if (isChatGptResponseActionTarget(target.element)) {
    return "chatgpt-response-actions";
  }

  return null;
};