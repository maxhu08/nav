import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

const CHATGPT_COMPOSER_SURFACE_SELECTOR =
  "form[data-type='unified-composer'] [data-composer-surface='true']";

const CHATGPT_COMPOSER_PLUS_BUTTON_SELECTOR =
  "#composer-plus-btn[aria-label='Add files and more'], [data-testid='composer-plus-btn'][aria-label='Add files and more']";

const isChatGptComposerFileInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement) || element.type.toLowerCase() !== "file") {
    return false;
  }

  if (element.closest("form[data-type='unified-composer']")) {
    return true;
  }

  const parent = element.parentElement;
  if (!parent) {
    return false;
  }

  return parent.querySelector("form[data-type='unified-composer']") instanceof HTMLElement;
};

const getChatGptComposerSurface = (element: HTMLElement): HTMLElement | null => {
  const composerSurface = element.closest(CHATGPT_COMPOSER_SURFACE_SELECTOR);
  return composerSurface instanceof HTMLElement ? composerSurface : null;
};

const getChatGptComposerUploadButton = (element: HTMLElement): HTMLElement | null => {
  const composerSurface = getChatGptComposerSurface(element);
  if (!composerSurface) {
    return null;
  }

  const uploadButton = composerSurface.querySelector(CHATGPT_COMPOSER_PLUS_BUTTON_SELECTOR);
  return uploadButton instanceof HTMLElement ? uploadButton : null;
};

const isChatGptComposerTarget = (element: HTMLElement): boolean => {
  const composerSurface = getChatGptComposerSurface(element);

  if (!composerSurface) {
    return false;
  }

  return (
    element.matches(CHATGPT_COMPOSER_PLUS_BUTTON_SELECTOR) ||
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

export const shouldSuppressChatGptDuplicateTarget = (element: HTMLElement): boolean => {
  if (isChatGptComposerFileInput(element)) {
    return true;
  }

  const uploadButton = getChatGptComposerUploadButton(element);
  if (!uploadButton) {
    return false;
  }

  if (element === uploadButton || element.matches(CHATGPT_COMPOSER_PLUS_BUTTON_SELECTOR)) {
    return false;
  }

  if (element instanceof HTMLInputElement && element.type.toLowerCase() === "file") {
    return true;
  }

  if (element.contains(uploadButton) || uploadButton.contains(element)) {
    return true;
  }

  if (
    element.querySelector("input[type='file']") instanceof HTMLInputElement ||
    element.closest("label")?.querySelector("input[type='file']") instanceof HTMLInputElement
  ) {
    return true;
  }

  return element instanceof HTMLLabelElement && element.control instanceof HTMLInputElement
    ? element.control.type.toLowerCase() === "file"
    : false;
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