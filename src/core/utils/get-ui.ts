import { getExtensionNamespace } from "~/src/utils/extension-id";
import type { FindStyleRenderParams } from "~/src/core/styles/render-find-styles";
import { getDocumentStyleRoot, upsertStyle } from "~/src/core/utils/inject-styles";

const extensionNamespace = getExtensionNamespace();
const OVERLAY_ROOT_STYLE_ID = `nav-${extensionNamespace}-overlay-style`;

export const OVERLAY_ROOT_ID = `nav-${extensionNamespace}-overlay`;
export const FOCUS_OVERLAY_ID = "nav-focus-overlay";
export const FOCUS_INDICATOR_EVENT = `nav-${extensionNamespace}-focus-indicator`;
export const FOCUS_STYLE_ID = "nav-focus-style";
export const FOCUS_POSITION_STYLE_ID = "nav-focus-position-style";
export const FIND_OVERLAY_ID = "nav-find-overlay";
export const FIND_STYLE_ID = "nav-find-style";
export const FIND_BAR_ID = "nav-find-bar";
export const FIND_INPUT_ID = "nav-find-input";
export const FIND_MATCH_COUNT_ID = "nav-find-match-count";
export const FIND_STATUS_ID = "nav-find-status";
export const FIND_STATUS_TEXT_ID = "nav-find-status-text";
export const FIND_PREV_BUTTON_ID = "nav-find-prev";
export const FIND_NEXT_BUTTON_ID = "nav-find-next";
export const FIND_CLEAR_BUTTON_ID = "nav-find-clear";
export const FIND_HIGHLIGHT_NAME = `nav-${extensionNamespace}-find-match`;
export const FIND_CURRENT_HIGHLIGHT_NAME = `nav-${extensionNamespace}-find-current-match`;
export const HINT_OVERLAY_ID = "nav-hint-overlay";
export const HINT_STYLE_ID = "nav-hint-style";
export const HINT_POSITION_STYLE_ID = "nav-hint-position-style";
export const WATCH_HINTS_ID = "nav-watch-hints";
export const WATCH_STYLE_ID = "nav-watch-style";
export const WATCH_POSITION_STYLE_ID = "nav-watch-position-style";

export const findStyleParams: FindStyleRenderParams = {
  findOverlayId: FIND_OVERLAY_ID,
  findBarId: FIND_BAR_ID,
  findStatusId: FIND_STATUS_ID,
  findInputId: FIND_INPUT_ID,
  findMatchCountId: FIND_MATCH_COUNT_ID,
  findStatusTextId: FIND_STATUS_TEXT_ID,
  findHighlightName: FIND_HIGHLIGHT_NAME,
  findCurrentHighlightName: FIND_CURRENT_HIGHLIGHT_NAME,
  findHighlightBackgroundColor: "rgba(234, 179, 8, 0.35)",
  findCurrentHighlightBackgroundColor: "#eab308",
  findHighlightTextColor: "#000000"
};

export const getOverlayRoot = (): HTMLDivElement | null =>
  document.getElementById(OVERLAY_ROOT_ID) as HTMLDivElement | null;

export const ensureOverlayRoot = (): HTMLDivElement => {
  const existing = getOverlayRoot();
  if (existing) {
    return existing;
  }

  upsertStyle(
    getDocumentStyleRoot(),
    OVERLAY_ROOT_STYLE_ID,
    `#${OVERLAY_ROOT_ID}{position:fixed;inset:0;pointer-events:none;z-index:2147483646;isolation:isolate}`
  );

  const root = document.createElement("div");
  root.id = OVERLAY_ROOT_ID;
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("data-nav-overlay-root", "true");
  (document.documentElement ?? document.body).append(root);
  return root;
};

export const getFindOverlay = (): HTMLDivElement | null =>
  document.getElementById(FIND_OVERLAY_ID) as HTMLDivElement | null;

export const getFindUIRoot = (): ShadowRoot | null => getFindOverlay()?.shadowRoot ?? null;

export const getFindBar = (): HTMLDivElement | null =>
  getFindUIRoot()?.getElementById(FIND_BAR_ID) as HTMLDivElement | null;

export const getFindInput = (): HTMLInputElement | null =>
  getFindUIRoot()?.getElementById(FIND_INPUT_ID) as HTMLInputElement | null;

export const getFindMatchCount = (): HTMLSpanElement | null =>
  getFindUIRoot()?.getElementById(FIND_MATCH_COUNT_ID) as HTMLSpanElement | null;

export const getFindBarActions = (): HTMLDivElement | null =>
  getFindUIRoot()?.querySelector(".nav-find-bar-actions") as HTMLDivElement | null;

export const getFindStatus = (): HTMLDivElement | null =>
  getFindUIRoot()?.getElementById(FIND_STATUS_ID) as HTMLDivElement | null;

export const getFindStatusText = (): HTMLSpanElement | null =>
  getFindUIRoot()?.getElementById(FIND_STATUS_TEXT_ID) as HTMLSpanElement | null;

export const getFindPrevButton = (): HTMLButtonElement | null =>
  getFindUIRoot()?.getElementById(FIND_PREV_BUTTON_ID) as HTMLButtonElement | null;

export const getFindNextButton = (): HTMLButtonElement | null =>
  getFindUIRoot()?.getElementById(FIND_NEXT_BUTTON_ID) as HTMLButtonElement | null;

export const getFindClearButton = (): HTMLButtonElement | null =>
  getFindUIRoot()?.getElementById(FIND_CLEAR_BUTTON_ID) as HTMLButtonElement | null;

export const isFindUIElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof Node)) {
    return false;
  }

  return !!(
    getFindOverlay()?.contains(target) ||
    getFindBar()?.contains(target) ||
    getFindStatus()?.contains(target)
  );
};