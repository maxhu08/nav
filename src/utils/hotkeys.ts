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
  "d scroll-half-page-down",
  "f show-hints-current-tab",
  "h scroll-left",
  "j scroll-down",
  "k scroll-up",
  "l scroll-right",
  "u scroll-half-page-up",
  "F show-hints-new-tab",
  "yy yank-current-tab-url",
  "gg scroll-to-top",
  "G scroll-to-bottom"
].join("\n");
