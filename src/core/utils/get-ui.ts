import { getExtensionNamespace } from "~/src/utils/extension-id";
import type { FindStyleRenderParams } from "~/src/core/styles/render-find-styles";

const extensionNamespace = getExtensionNamespace();

export const FOCUS_OVERLAY_ID = `nav-${extensionNamespace}-focus-overlay`;
export const FOCUS_INDICATOR_EVENT = `nav-${extensionNamespace}-focus-indicator`;
export const FOCUS_STYLE_ID = `nav-${extensionNamespace}-focus-style`;
export const FIND_OVERLAY_ID = `nav-${extensionNamespace}-find-overlay`;
export const FIND_STYLE_ID = `nav-${extensionNamespace}-find-style`;
export const FIND_BAR_ID = `nav-${extensionNamespace}-find-bar`;
export const FIND_INPUT_ID = `nav-${extensionNamespace}-find-input`;
export const FIND_MATCH_COUNT_ID = `nav-${extensionNamespace}-find-match-count`;
export const FIND_STATUS_ID = `nav-${extensionNamespace}-find-status`;
export const FIND_STATUS_TEXT_ID = `nav-${extensionNamespace}-find-status-text`;
export const FIND_PREV_BUTTON_ID = `nav-${extensionNamespace}-find-prev`;
export const FIND_NEXT_BUTTON_ID = `nav-${extensionNamespace}-find-next`;
export const FIND_CLEAR_BUTTON_ID = `nav-${extensionNamespace}-find-clear`;
export const FIND_HIGHLIGHT_NAME = `nav-${extensionNamespace}-find-match`;
export const FIND_CURRENT_HIGHLIGHT_NAME = `nav-${extensionNamespace}-find-current-match`;
export const WATCH_HINTS_ID = `nav-${extensionNamespace}-watch-hints`;

export const findStyleParams: FindStyleRenderParams = {
  findBarId: FIND_BAR_ID,
  findStatusId: FIND_STATUS_ID,
  findInputId: FIND_INPUT_ID,
  findMatchCountId: FIND_MATCH_COUNT_ID,
  findStatusTextId: FIND_STATUS_TEXT_ID,
  findHighlightName: FIND_HIGHLIGHT_NAME,
  findCurrentHighlightName: FIND_CURRENT_HIGHLIGHT_NAME
};

export const getFindOverlay = (): HTMLDivElement | null =>
  document.getElementById(FIND_OVERLAY_ID) as HTMLDivElement | null;

export const getFindUiRoot = (): ShadowRoot | null => getFindOverlay()?.shadowRoot ?? null;

export const getFindBar = (): HTMLDivElement | null =>
  getFindUiRoot()?.getElementById(FIND_BAR_ID) as HTMLDivElement | null;

export const getFindInput = (): HTMLInputElement | null =>
  getFindUiRoot()?.getElementById(FIND_INPUT_ID) as HTMLInputElement | null;

export const getFindMatchCount = (): HTMLSpanElement | null =>
  getFindUiRoot()?.getElementById(FIND_MATCH_COUNT_ID) as HTMLSpanElement | null;

export const getFindBarActions = (): HTMLDivElement | null =>
  getFindUiRoot()?.querySelector(".nav-find-bar-actions") as HTMLDivElement | null;

export const getFindStatus = (): HTMLDivElement | null =>
  getFindUiRoot()?.getElementById(FIND_STATUS_ID) as HTMLDivElement | null;

export const getFindStatusText = (): HTMLSpanElement | null =>
  getFindUiRoot()?.getElementById(FIND_STATUS_TEXT_ID) as HTMLSpanElement | null;

export const getFindPrevButton = (): HTMLButtonElement | null =>
  getFindUiRoot()?.getElementById(FIND_PREV_BUTTON_ID) as HTMLButtonElement | null;

export const getFindNextButton = (): HTMLButtonElement | null =>
  getFindUiRoot()?.getElementById(FIND_NEXT_BUTTON_ID) as HTMLButtonElement | null;

export const getFindClearButton = (): HTMLButtonElement | null =>
  getFindUiRoot()?.getElementById(FIND_CLEAR_BUTTON_ID) as HTMLButtonElement | null;

export const isFindUiElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof Node)) {
    return false;
  }

  return (
    getFindOverlay()?.contains(target) === true ||
    getFindBar()?.contains(target) === true ||
    getFindStatus()?.contains(target) === true
  );
};
