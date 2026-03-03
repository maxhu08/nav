export type ActionName =
  | "history-go-prev"
  | "history-go-next"
  | "close-current-tab"
  | "create-new-tab"
  | "reload-current-tab"
  | "toggle-hints-current-tab"
  | "toggle-hints-new-tab"
  | "yank-current-tab-url"
  | "scroll-down"
  | "scroll-half-page-down"
  | "scroll-half-page-up"
  | "scroll-left"
  | "scroll-right"
  | "scroll-up"
  | "scroll-to-bottom"
  | "scroll-to-top";

export const VALID_ACTION_NAMES = new Set<ActionName>([
  "history-go-prev",
  "history-go-next",
  "close-current-tab",
  "create-new-tab",
  "reload-current-tab",
  "toggle-hints-current-tab",
  "toggle-hints-new-tab",
  "yank-current-tab-url",
  "scroll-down",
  "scroll-half-page-down",
  "scroll-half-page-up",
  "scroll-left",
  "scroll-right",
  "scroll-up",
  "scroll-to-bottom",
  "scroll-to-top"
]);

export const isActionName = (value: string): value is ActionName => {
  return VALID_ACTION_NAMES.has(value as ActionName);
};

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

  // history
  "H history-go-prev",
  "L history-go-next",

  // hints
  "f toggle-hints-current-tab",
  "F toggle-hints-new-tab",

  // tabs
  "# t create-new-tab",
  "# x close-current-tab",
  "# r reload-current-tab",

  // clipboard
  "yy yank-current-tab-url"
].join("\n");

export const DEFAULT_HINT_CHARSET = "sadfjklewcmurpgh";
export const DEFAULT_HINT_PREFERRED_SEARCH_LABELS = "kj kjf kjfd";

export const DEFAULT_HINT_AVOID_ADJACENT_PAIRS = [
  "# double letters",
  "aa cc dd ee ff gg hh jj kk ll mm pp ss ww",
  "",
  "# same finger bigrams",
  "cd ce dc de ec ed fg gf hj hm jh jm mh mj sw ws",
  "",
  "# other",
  "aw sa wa "
].join("\n");
