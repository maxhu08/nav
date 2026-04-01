import {
  HINT_OVERLAY_ID,
  HINT_POSITION_STYLE_ID as HINT_POSITION_STYLE_ID_FROM_UI,
  HINT_STYLE_ID as HINT_STYLE_ID_FROM_UI
} from "~/src/core/utils/get-ui";

export const DEFAULT_HINT_CHARSET = "sadfjklewcmupgh";
export const HINT_CONTAINER_ID = HINT_OVERLAY_ID;
export const HINT_POSITION_STYLE_ID = HINT_POSITION_STYLE_ID_FROM_UI;
export const HINT_STYLE_ID = HINT_STYLE_ID_FROM_UI;
export const MARKER_ATTRIBUTE = "data-nav-hint-marker";
export const MARKER_VARIANT_ATTRIBUTE = "data-nav-hint-marker-variant";
export const MARKER_LABEL_ATTRIBUTE = "data-nav-hint-marker-label";
export const MARKER_ICON_ATTRIBUTE = "data-nav-hint-marker-icon";
export const LETTER_ATTRIBUTE = "data-nav-hint-marker-letter";
export const HINT_MARKER_EDGE_GAP = 8;
export const HINT_MARKER_MIN_GAP = 2;

export const CLICKABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([type='hidden']):not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "summary",
  "details",
  "img[usemap]",
  "[role='button']",
  "[role='link']",
  "[contenteditable='true']",
  "[contenteditable='plaintext-only']",
  "[onclick]",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

export const IMAGE_SELECTOR = "img[src], image[href], image[xlink\\:href]";