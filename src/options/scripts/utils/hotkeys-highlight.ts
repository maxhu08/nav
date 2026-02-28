import { hotkeysMappingsHighlightEl, hotkeysMappingsTextareaEl } from "~/src/options/scripts/ui";
import { isActionName } from "~/src/utils/hotkeys";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const renderLine = (line: string): string => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return "";
  }

  if (trimmedLine.startsWith("#")) {
    return wrapToken("hotkeys-mappings-token-comment", line);
  }

  const separatorIndex = line.search(/\s/);

  if (separatorIndex === -1) {
    return wrapToken("hotkeys-mappings-token-invalid", line);
  }

  const sequence = line.slice(0, separatorIndex);
  const spacingAndAction = line.slice(separatorIndex);
  const trimmedAction = spacingAndAction.trim();
  const spacingLength = spacingAndAction.length - spacingAndAction.trimStart().length;
  const spacing = spacingAndAction.slice(0, spacingLength);
  const action = spacingAndAction.slice(spacingLength);
  const actionClass = isActionName(trimmedAction)
    ? "hotkeys-mappings-token-action"
    : "hotkeys-mappings-token-invalid";

  return [
    wrapToken("hotkeys-mappings-token-sequence", sequence),
    escapeHtml(spacing),
    wrapToken(actionClass, action)
  ].join("");
};

export const syncHotkeysMappingsHighlight = (): void => {
  hotkeysMappingsHighlightEl.innerHTML = hotkeysMappingsTextareaEl.value
    .split("\n")
    .map(renderLine)
    .join("\n");
};

export const syncHotkeysMappingsHighlightScroll = (): void => {
  hotkeysMappingsHighlightEl.scrollTop = hotkeysMappingsTextareaEl.scrollTop;
  hotkeysMappingsHighlightEl.scrollLeft = hotkeysMappingsTextareaEl.scrollLeft;
};
