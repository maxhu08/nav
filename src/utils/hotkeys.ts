export type ActionName =
  | "show-hints-current-tab"
  | "show-hints-new-tab"
  | "yank-current-tab-url"
  | "scroll-down"
  | "scroll-half-page-down"
  | "scroll-half-page-up"
  | "scroll-left"
  | "scroll-right"
  | "scroll-up"
  | "scroll-to-bottom"
  | "scroll-to-top";

export const DEFAULT_HOTKEY_MAPPINGS = [
  // scroll
  "j scroll-down",
  "k scroll-up",
  "h scroll-left",
  "l scroll-right",
  "d scroll-half-page-down",
  "u scroll-half-page-up",
  "gg scroll-to-top",
  "G scroll-to-bottom",

  // hints
  "f show-hints-current-tab",
  "F show-hints-new-tab",

  // clipboard
  "yy yank-current-tab-url"
].join("\n");
