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

export type HotkeyActionMode = "normal" | "find" | "watch";

export type HotkeyMappings = Partial<Record<string, Partial<Record<HotkeyActionMode, ActionName>>>>;

const FIND_MODE_ACTION_NAMES = new Set<ActionName>(["cycle-match-next", "cycle-match-prev"]);
const WATCH_MODE_ACTION_NAMES = new Set<ActionName>(["toggle-fullscreen", "toggle-play-pause"]);

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

# find
/ enable-find-mode
n cycle-match-next # requires find mode
N cycle-match-prev # requires find mode

# watch
w toggle-video-controls
f toggle-fullscreen # requires watch mode
k toggle-play-pause # requires watch mode
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
