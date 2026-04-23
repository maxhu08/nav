import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

const CHATGPT_COMPOSER_SURFACE_SELECTOR =
  "form[data-type='unified-composer'] [data-composer-surface='true']";

const CHATGPT_COMPOSER_PLUS_BUTTON_SELECTOR =
  "#composer-plus-btn[aria-label='Add files and more'], [data-testid='composer-plus-btn'][aria-label='Add files and more']";

const CHATGPT_COMPOSER_TEXTBOX_SELECTOR =
  "#prompt-textarea.ProseMirror[role='textbox'][aria-label='Chat with ChatGPT']";

const CHATGPT_COMPOSER_BOTTOM_ROW_TARGET_SELECTOR = [
  CHATGPT_COMPOSER_PLUS_BUTTON_SELECTOR,
  "button[aria-label='Start dictation']",
  "button[aria-label='Start Voice']",
  "button[data-testid='send-button']",
  "button[aria-label='Send prompt']",
  "[data-testid='composer-footer-actions'] button"
].join(", ");

const CHATGPT_EXPANDED_COMPOSER_MIN_HEIGHT = 72;

export const isChatGptHintContext = (): boolean => {
  if (/(^|\.)chatgpt\.com$/i.test(window.location.hostname)) {
    return true;
  }

  return (
    document.querySelector("form[data-type='unified-composer']") instanceof HTMLElement ||
    document.querySelector("[data-sidebar-item='true']") instanceof HTMLElement ||
    document.querySelector("[role='menu'][aria-label='Conversation options']") instanceof
      HTMLElement ||
    document.querySelector("[aria-label='Response actions'][role='group']") instanceof HTMLElement
  );
};

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

const isChatGptExpandedComposer = (element: HTMLElement): boolean => {
  const form = element.closest("form[data-type='unified-composer']");

  if (!(form instanceof HTMLElement)) {
    return false;
  }

  if (form.hasAttribute("data-expanded")) {
    return true;
  }

  const composerSurface = getChatGptComposerSurface(element);

  if (!(composerSurface instanceof HTMLElement)) {
    return false;
  }

  if (
    composerSurface.querySelector("[data-testid='composer-footer-actions']") instanceof HTMLElement
  ) {
    return true;
  }

  return composerSurface.getBoundingClientRect().height >= CHATGPT_EXPANDED_COMPOSER_MIN_HEIGHT;
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
    element.matches(CHATGPT_COMPOSER_TEXTBOX_SELECTOR) ||
    element.matches("button[aria-label='Start dictation']") ||
    element.matches("button[aria-label='Start Voice']") ||
    element.matches("button[data-testid='send-button']") ||
    element.matches("button[aria-label='Send prompt']")
  );
};

export const shouldPositionChatGptComposerDirectiveInCorner = (target: HintTarget): boolean => {
  if (target.directiveMatch?.directive !== "input") {
    return false;
  }

  return (
    target.element.matches(CHATGPT_COMPOSER_TEXTBOX_SELECTOR) &&
    isChatGptExpandedComposer(target.element)
  );
};

export const getChatGptComposerDirectiveCornerRect = (target: HintTarget): DOMRect | null => {
  if (!shouldPositionChatGptComposerDirectiveInCorner(target)) {
    return null;
  }

  const uploadButton = getChatGptComposerUploadButton(target.element);

  if (!(uploadButton instanceof HTMLElement)) {
    return target.rect;
  }

  const uploadRect = uploadButton.getBoundingClientRect();

  return new DOMRect(uploadRect.left, target.rect.top, uploadRect.width, target.rect.height);
};

const isChatGptExpandedComposerBottomRowTarget = (element: HTMLElement): boolean => {
  return (
    isChatGptExpandedComposer(element) &&
    element.matches(CHATGPT_COMPOSER_BOTTOM_ROW_TARGET_SELECTOR)
  );
};

export const getChatGptSpecialRowTop = (target: HintTarget): number | null => {
  if (!isChatGptExpandedComposerBottomRowTarget(target.element)) {
    return null;
  }

  const uploadButton = getChatGptComposerUploadButton(target.element);

  return uploadButton instanceof HTMLElement
    ? uploadButton.getBoundingClientRect().top
    : target.rect.top;
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
  if (isChatGptExpandedComposerBottomRowTarget(target.element)) {
    return "chatgpt-expanded-composer-bottom";
  }

  if (isChatGptComposerTarget(target.element)) {
    return "chatgpt-composer";
  }

  if (isChatGptResponseActionTarget(target.element)) {
    return "chatgpt-response-actions";
  }

  return null;
};