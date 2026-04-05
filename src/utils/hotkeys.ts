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
  | "hint-mode-right-click"
  | "create-new-tab"
  | "close-current-tab"
  | "close-tabs-other"
  | "close-tabs-left"
  | "close-tabs-right"
  | "reload-current-tab"
  | "reload-current-tab-hard"
  | "tab-go-prev"
  | "tab-go-next"
  | "first-tab"
  | "last-tab"
  | "move-tab-left"
  | "move-tab-right"
  | "restore-closed-tab"
  | "visit-previous-tab"
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
  | "bar-mode-current-tab"
  | "bar-mode-new-tab"
  | "bar-mode-edit-current-tab"
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
  "hint-mode-right-click",
  "create-new-tab",
  "close-current-tab",
  "close-tabs-other",
  "close-tabs-left",
  "close-tabs-right",
  "reload-current-tab",
  "reload-current-tab-hard",
  "tab-go-prev",
  "tab-go-next",
  "first-tab",
  "last-tab",
  "move-tab-left",
  "move-tab-right",
  "restore-closed-tab",
  "visit-previous-tab",
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
  "bar-mode-current-tab",
  "bar-mode-new-tab",
  "bar-mode-edit-current-tab",
  "cycle-match-next",
  "cycle-match-prev",
  "watch-mode",
  "toggle-fullscreen",
  "toggle-play-pause",
  "toggle-loop",
  "toggle-mute",
  "toggle-captions"
]);

export const HOTKEY_UNBOUND_SEQUENCE = "<unbound>";

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
  | "duplicate-sequence-mode"
  | "missing-action-declaration";

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
  },
  {
    code: "missing-action-declaration",
    message: "Every action must be declared at least once."
  }
];

const getHotkeyMappingErrorMessage = (code: HotkeyMappingErrorCode): string => {
  const errorDefinition = HOTKEY_MAPPING_AVAILABLE_ERRORS.find((error) => error.code === code);
  return errorDefinition?.message ?? "Unknown hotkey mapping error.";
};

export type HotkeyMappingError = {
  code: HotkeyMappingErrorCode;
  message: string;
  lineNumber: number | null;
};

export type ParsedHotkeyMappings = {
  mappings: HotkeyMappings;
  errors: HotkeyMappingError[];
};

const addHotkeyMappingError = (
  errors: HotkeyMappingError[],
  code: HotkeyMappingErrorCode,
  lineNumber: number | null,
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
  const declaredActions = new Set<ActionName>();

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

    declaredActions.add(actionCandidate);

    if (sequence === HOTKEY_UNBOUND_SEQUENCE) {
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

  for (const actionName of VALID_ACTION_NAMES) {
    if (declaredActions.has(actionName)) {
      continue;
    }

    addHotkeyMappingError(
      errors,
      "missing-action-declaration",
      null,
      `Declare "${actionName}" or set it to "${HOTKEY_UNBOUND_SEQUENCE}".`
    );
  }

  return {
    mappings,
    errors
  };
};