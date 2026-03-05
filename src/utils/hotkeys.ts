export type ActionName =
  | "toggle-video-controls"
  | "toggle-fullscreen"
  | "toggle-play-pause"
  | "enable-find-mode"
  | "cycle-match-next"
  | "cycle-match-prev"
  | "history-go-prev"
  | "history-go-next"
  | "tab-go-prev"
  | "tab-go-next"
  | "duplicate-current-tab"
  | "move-current-tab-to-new-window"
  | "close-current-tab"
  | "create-new-tab"
  | "reload-current-tab"
  | "reload-current-tab-hard"
  | "toggle-hints-current-tab"
  | "toggle-hints-new-tab"
  | "yank-link-url"
  | "yank-image"
  | "yank-image-url"
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
  "toggle-video-controls",
  "toggle-fullscreen",
  "toggle-play-pause",
  "enable-find-mode",
  "cycle-match-next",
  "cycle-match-prev",
  "history-go-prev",
  "history-go-next",
  "tab-go-prev",
  "tab-go-next",
  "duplicate-current-tab",
  "move-current-tab-to-new-window",
  "close-current-tab",
  "create-new-tab",
  "reload-current-tab",
  "reload-current-tab-hard",
  "toggle-hints-current-tab",
  "toggle-hints-new-tab",
  "yank-link-url",
  "yank-image",
  "yank-image-url",
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

export const DEFAULT_HOTKEY_MAPPINGS = `# scroll
j scroll-down
k scroll-up
h scroll-left
l scroll-right
d scroll-half-page-down
u scroll-half-page-up
gg scroll-to-top
G scroll-to-bottom

# watch
w toggle-video-controls

# find
/ enable-find-mode
n cycle-match-next # requires find mode
N cycle-match-prev # requires find mode

# hints
f toggle-hints-current-tab
F toggle-hints-new-tab

# tab actions
t create-new-tab
x close-current-tab
r reload-current-tab
R reload-current-tab-hard
J tab-go-prev
K tab-go-next
yt duplicate-current-tab
W move-current-tab-to-new-window

# clipboard
yl yank-link-url
yi yank-image
yI yank-image-url
yy yank-current-tab-url

# history
H history-go-prev
L history-go-next
`.trim();

export const DEFAULT_HINT_CHARSET = "sadfjklewcmupgh";

export const DEFAULT_HINT_PREFERRED_SEARCH_LABELS = "kj kjf kjfd";

export const DEFAULT_HINT_AVOID_ADJACENT_PAIRS = `# double letters
aa cc dd ee ff gg hh jj kk ll mm pp ss ww

# same finger bigrams
cd ce dc de ec ed fg gf hj hm jh jm mh mj sw ws

# other
aw sa wa wd dw kp pk kl lp
`.trim();
