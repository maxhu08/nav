export type ActionName =
  | "scroll-down"
  | "scroll-up"
  | "scroll-left"
  | "scroll-right"
  | "scroll-half-page-down"
  | "scroll-half-page-up"
  | "scroll-to-top"
  | "scroll-to-bottom"
  | "hint-mode-current-tab"
  | "hint-mode-new-tab"
  | "create-new-tab"
  | "close-current-tab"
  | "reload-current-tab"
  | "reload-current-tab-hard"
  | "tab-go-prev"
  | "tab-go-next"
  | "duplicate-current-tab"
  | "duplicate-current-tab-origin"
  | "move-current-tab-to-new-window"
  | "yank-link-url"
  | "yank-image"
  | "yank-image-url"
  | "yank-current-tab-url"
  | "yank-current-tab-url-clean"
  | "history-go-prev"
  | "history-go-next"
  | "follow-prev"
  | "follow-next"
  | "find-mode"
  | "cycle-match-next"
  | "cycle-match-prev"
  | "watch-mode"
  | "toggle-fullscreen"
  | "toggle-play-pause"
  | "toggle-loop"
  | "toggle-mute"
  | "toggle-captions";

export const VALID_ACTION_NAMES = new Set<ActionName>([
  "scroll-down",
  "scroll-up",
  "scroll-left",
  "scroll-right",
  "scroll-half-page-down",
  "scroll-half-page-up",
  "scroll-to-top",
  "scroll-to-bottom",
  "hint-mode-current-tab",
  "hint-mode-new-tab",
  "create-new-tab",
  "close-current-tab",
  "reload-current-tab",
  "reload-current-tab-hard",
  "tab-go-prev",
  "tab-go-next",
  "duplicate-current-tab",
  "duplicate-current-tab-origin",
  "move-current-tab-to-new-window",
  "yank-link-url",
  "yank-image",
  "yank-image-url",
  "yank-current-tab-url",
  "yank-current-tab-url-clean",
  "history-go-prev",
  "history-go-next",
  "follow-prev",
  "follow-next",
  "find-mode",
  "cycle-match-next",
  "cycle-match-prev",
  "watch-mode",
  "toggle-fullscreen",
  "toggle-play-pause",
  "toggle-loop",
  "toggle-mute",
  "toggle-captions"
]);

export const isActionName = (value: string): value is ActionName => {
  return VALID_ACTION_NAMES.has(value as ActionName);
};

export type HotkeyActionMode = "normal" | "find" | "watch";

export type HotkeyMappings = Partial<Record<string, Partial<Record<HotkeyActionMode, ActionName>>>>;

const FIND_MODE_ACTION_NAMES = new Set<ActionName>(["cycle-match-next", "cycle-match-prev"]);
const WATCH_MODE_ACTION_NAMES = new Set<ActionName>([
  "toggle-fullscreen",
  "toggle-play-pause",
  "toggle-loop",
  "toggle-mute",
  "toggle-captions"
]);

export const getActionMode = (actionName: ActionName): HotkeyActionMode => {
  if (FIND_MODE_ACTION_NAMES.has(actionName)) {
    return "find";
  }

  if (WATCH_MODE_ACTION_NAMES.has(actionName)) {
    return "watch";
  }

  return "normal";
};

export type HotkeyMappingErrorCode =
  | "missing-separator"
  | "missing-sequence"
  | "missing-action"
  | "invalid-action"
  | "duplicate-sequence-mode";

type HotkeyMappingErrorDefinition = {
  code: HotkeyMappingErrorCode;
  message: string;
};

export const HOTKEY_MAPPING_AVAILABLE_ERRORS: HotkeyMappingErrorDefinition[] = [
  {
    code: "missing-separator",
    message: "Missing whitespace separator between key sequence and action name."
  },
  {
    code: "missing-sequence",
    message: "Missing key sequence before the action name."
  },
  {
    code: "missing-action",
    message: "Missing action name after the key sequence."
  },
  {
    code: "invalid-action",
    message: "Unknown action name."
  },
  {
    code: "duplicate-sequence-mode",
    message: "Sequence is already used by another action in the same mode."
  }
];

const getHotkeyMappingErrorMessage = (code: HotkeyMappingErrorCode): string => {
  const errorDefinition = HOTKEY_MAPPING_AVAILABLE_ERRORS.find((error) => error.code === code);
  return errorDefinition?.message ?? "Unknown hotkey mapping error.";
};

export type HotkeyMappingError = {
  code: HotkeyMappingErrorCode;
  message: string;
  lineNumber: number;
};

export type ParsedHotkeyMappings = {
  mappings: HotkeyMappings;
  errors: HotkeyMappingError[];
};

const addHotkeyMappingError = (
  errors: HotkeyMappingError[],
  code: HotkeyMappingErrorCode,
  lineNumber: number,
  detail?: string
): void => {
  const baseMessage = getHotkeyMappingErrorMessage(code);

  errors.push({
    code,
    lineNumber,
    message: detail ? `${baseMessage} ${detail}` : baseMessage
  });
};

export const parseHotkeyMappingsValue = (value: string): ParsedHotkeyMappings => {
  const mappings: HotkeyMappings = {};
  const errors: HotkeyMappingError[] = [];

  for (const [index, line] of value.split("\n").entries()) {
    const lineNumber = index + 1;
    const commentStartIndex = line.indexOf("#");
    const lineWithoutComment = commentStartIndex === -1 ? line : line.slice(0, commentStartIndex);
    const trimmedLine = lineWithoutComment.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.search(/\s/);

    if (separatorIndex === -1) {
      addHotkeyMappingError(errors, "missing-separator", lineNumber);
      addHotkeyMappingError(errors, "missing-action", lineNumber);
      continue;
    }

    const sequence = trimmedLine.slice(0, separatorIndex).trim();
    const actionCandidate = trimmedLine.slice(separatorIndex).trim();

    if (!sequence) {
      addHotkeyMappingError(errors, "missing-sequence", lineNumber);
      continue;
    }

    if (!actionCandidate) {
      addHotkeyMappingError(errors, "missing-action", lineNumber);
      continue;
    }

    if (!isActionName(actionCandidate)) {
      addHotkeyMappingError(errors, "invalid-action", lineNumber, `Received "${actionCandidate}".`);
      continue;
    }

    const mode = getActionMode(actionCandidate);
    mappings[sequence] ??= {};

    if (mappings[sequence]?.[mode]) {
      addHotkeyMappingError(
        errors,
        "duplicate-sequence-mode",
        lineNumber,
        `Mode "${mode}" already has a binding for "${sequence}".`
      );
      continue;
    }

    mappings[sequence]![mode] = actionCandidate;
  }

  return {
    mappings,
    errors
  };
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

# hints
f hint-mode-current-tab
F hint-mode-new-tab

# tab actions
t create-new-tab
x close-current-tab
r reload-current-tab
R reload-current-tab-hard
J tab-go-prev
K tab-go-next
yt duplicate-current-tab
yo duplicate-current-tab-origin
W move-current-tab-to-new-window

# clipboard
yl yank-link-url
yi yank-image
yI yank-image-url
yy yank-current-tab-url
yc yank-current-tab-url-clean

# misc
H history-go-prev
L history-go-next
[ follow-prev
] follow-next

# find
/ find-mode
n cycle-match-next # requires find mode
N cycle-match-prev # requires find mode

# watch
w watch-mode
f toggle-fullscreen # requires watch mode
e toggle-play-pause # requires watch mode
l toggle-loop # requires watch mode
m toggle-mute # requires watch mode
c toggle-captions # requires watch mode
`.trim();

export const DEFAULT_HINT_CHARSET = "sadfjklewcmupgh";

export const DEFAULT_HINT_RESERVED_LABELS = `@input kj kjf kjfd
@attach up
@share sh
@download dl
@login si
@microphone mic
@delete dd
@save sv
@copy cp
@hide hi
@home sd sdf sdfj
@sidebar we wer wert
@next kl
@prev lk
@cancel no
@submit ok
@like iu
@dislike oi`;

export const DEFAULT_HINT_AVOID_ADJACENT_PAIRS = `# double letters
aa cc dd ee ff gg hh jj kk ll mm pp ss ww

# same finger bigrams
cd ce dc de ec ed fg gf hj hm jh jm mh mj sw ws

# other
aw sa wa wd dw kp pk kl lp
`.trim();