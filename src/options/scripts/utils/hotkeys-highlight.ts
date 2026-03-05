import {
  hotkeysMappingsHighlightEl,
  hotkeysMappingsStatusEl,
  hotkeysMappingsTextareaEl
} from "~/src/options/scripts/ui";
import { setEditorStatus } from "~/src/options/scripts/utils/editor-status";
import { isActionName } from "~/src/utils/hotkeys";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const renderLine = (line: string): { hasError: boolean; html: string } => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return { hasError: false, html: "" };
  }

  if (trimmedLine.startsWith("#")) {
    return {
      hasError: false,
      html: wrapToken("hotkeys-mappings-token-comment", line)
    };
  }

  const separatorIndex = line.search(/\s/);

  if (separatorIndex === -1) {
    return {
      hasError: true,
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
  const hasError = !isActionName(actionName);
  const actionClass = hasError ? "hotkeys-mappings-token-invalid" : "hotkeys-mappings-token-action";

  return {
    hasError,
    html: [
      wrapToken("hotkeys-mappings-token-sequence", sequence),
      escapeHtml(spacing),
      wrapToken(actionClass, action),
      inlineComment ? wrapToken("hotkeys-mappings-token-comment", inlineComment) : ""
    ].join("")
  };
};

export const syncHotkeysMappingsHighlight = (): void => {
  let hasError = false;

  hotkeysMappingsHighlightEl.innerHTML = hotkeysMappingsTextareaEl.value
    .split("\n")
    .map((line) => {
      const result = renderLine(line);
      hasError ||= result.hasError;
      return result.html;
    })
    .join("\n");

  setEditorStatus(hotkeysMappingsStatusEl, hasError);
};

export const syncHotkeysMappingsHighlightScroll = (): void => {
  hotkeysMappingsHighlightEl.scrollTop = hotkeysMappingsTextareaEl.scrollTop;
  hotkeysMappingsHighlightEl.scrollLeft = hotkeysMappingsTextareaEl.scrollLeft;
};
