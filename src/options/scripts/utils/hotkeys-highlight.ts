import {
  hotkeysMappingsHighlightEl,
  hotkeysMappingsStatusEl,
  hotkeysMappingsTextareaEl
} from "~/src/options/scripts/ui";
import { getTextareaOverlayHTML } from "~/src/options/scripts/utils/editor-highlight";
import { setEditorStatus } from "~/src/options/scripts/utils/editor-status";
import { getActionMode, isActionName, parseHotkeyMappingsValue } from "~/src/utils/hotkeys";
import { t } from "~/src/options/scripts/i18n";

const errorMessages = {
  "missing-separator": "Missing whitespace separator between key sequence and action name.",
  "missing-sequence": "Missing key sequence before the action name.",
  "missing-action": "Missing action name after the key sequence.",
  "invalid-action": 'Unknown action name. Received "{action}".',
  "duplicate-sequence-mode":
    'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".',
  "missing-action-declaration":
    'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".'
} as const;

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const getActionClassName = (actionName: string): string => {
  if (!isActionName(actionName)) {
    return "hotkeys-mappings-token-invalid";
  }

  const mode = getActionMode(actionName);

  if (mode === "watch") {
    return "hotkeys-mappings-token-action-watch";
  }

  if (mode === "find") {
    return "hotkeys-mappings-token-action-find";
  }

  return "hotkeys-mappings-token-action";
};

const getSequenceClassName = (_sequence: string, lineHasError: boolean): string => {
  if (lineHasError) {
    return "hotkeys-mappings-token-invalid";
  }

  return "hotkeys-mappings-token-sequence";
};

const renderLine = (
  line: string,
  lineHasError: boolean
): {
  html: string;
} => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return { html: "" };
  }

  if (trimmedLine.startsWith("#")) {
    return {
      html: wrapToken("hotkeys-mappings-token-comment", line)
    };
  }

  const separatorIndex = line.search(/\s/);

  if (separatorIndex === -1) {
    return {
      html: wrapToken("hotkeys-mappings-token-invalid", line)
    };
  }

  const sequence = line.slice(0, separatorIndex);
  const spacingAndAction = line.slice(separatorIndex);
  const spacingLength = spacingAndAction.length - spacingAndAction.trimStart().length;
  const spacing = spacingAndAction.slice(0, spacingLength);
  const rawActionAndComment = spacingAndAction.slice(spacingLength);
  const commentStartIndex = rawActionAndComment.indexOf("#");
  const action =
    commentStartIndex === -1
      ? rawActionAndComment
      : rawActionAndComment.slice(0, commentStartIndex);
  const inlineComment =
    commentStartIndex === -1 ? "" : rawActionAndComment.slice(commentStartIndex);
  const actionName = action.trim();
  const actionClass = lineHasError
    ? "hotkeys-mappings-token-invalid"
    : getActionClassName(actionName);
  const sequenceClass = getSequenceClassName(sequence, lineHasError);

  return {
    html: [
      wrapToken(sequenceClass, sequence),
      escapeHtml(spacing),
      wrapToken(actionClass, action),
      inlineComment ? wrapToken("hotkeys-mappings-token-comment", inlineComment) : ""
    ].join("")
  };
};

export const syncHotkeysMappingsHighlight = (): void => {
  const parsedMappings = parseHotkeyMappingsValue(hotkeysMappingsTextareaEl.value);
  const errorsByLine = new Map<number, string[]>();

  for (const error of parsedMappings.errors) {
    if (error.lineNumber === null) {
      continue;
    }

    const errors = errorsByLine.get(error.lineNumber) ?? [];
    errors.push(`[${error.code}] line ${error.lineNumber}: ${error.message}`);
    errorsByLine.set(error.lineNumber, errors);
  }

  const html = hotkeysMappingsTextareaEl.value
    .split("\n")
    .map((line, index) => {
      const lineNumber = index + 1;
      const lineHasError = (errorsByLine.get(lineNumber)?.length ?? 0) > 0;
      return renderLine(line, lineHasError).html;
    })
    .join("\n");

  hotkeysMappingsHighlightEl.innerHTML = getTextareaOverlayHTML(
    hotkeysMappingsTextareaEl.value,
    html
  );

  setEditorStatus(
    hotkeysMappingsStatusEl,
    parsedMappings.errors.map((error) => {
      const message = t(errorMessages[error.code], error.values);
      return {
        code: error.code,
        message:
          error.lineNumber === null
            ? message
            : t("line {line}: {message}", { line: error.lineNumber, message })
      };
    })
  );
};

export const syncHotkeysMappingsHighlightScroll = (): void => {
  hotkeysMappingsHighlightEl.scrollTop = hotkeysMappingsTextareaEl.scrollTop;
  hotkeysMappingsHighlightEl.scrollLeft = hotkeysMappingsTextareaEl.scrollLeft;
};