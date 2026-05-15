import {
  barSearchBookmarksStorageHighlightEl,
  barSearchBookmarksStorageStatusEl,
  barSearchBookmarksStorageTextareaEl
} from "~/src/options/scripts/ui";
import { getTextareaOverlayHTML } from "~/src/options/scripts/utils/editor-highlight";
import { type EditorStatusError, setEditorStatus } from "~/src/options/scripts/utils/editor-status";
import { parseBarBookmarkLine } from "~/src/utils/bar-bookmarks";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const renderLine = (
  line: string,
  lineNumber: number
): { html: string; errors: EditorStatusError[] } => {
  if (!line) {
    return { html: "", errors: [] };
  }

  if (!parseBarBookmarkLine(line)) {
    return {
      html: wrapToken("bar-search-bookmarks-storage-token-invalid", line),
      errors: [
        {
          code: "invalid-bookmark",
          message: `line ${lineNumber}: Expected format "bookmark name": "value".`
        }
      ]
    };
  }

  const separatorIndex = line.indexOf(": ");
  const name = line.slice(0, separatorIndex);
  const url = line.slice(separatorIndex + 2);

  return {
    html: [
      wrapToken("bar-search-bookmarks-storage-token-name", name),
      wrapToken("bar-search-bookmarks-storage-token-separator", ": "),
      wrapToken("bar-search-bookmarks-storage-token-url", url)
    ].join(""),
    errors: []
  };
};

export const syncBarSearchBookmarksStorageHighlight = (): void => {
  const errors: EditorStatusError[] = [];
  const html = barSearchBookmarksStorageTextareaEl.value
    .split("\n")
    .map((line, index) => {
      const result = renderLine(line, index + 1);
      errors.push(...result.errors);
      return result.html;
    })
    .join("\n");

  barSearchBookmarksStorageHighlightEl.innerHTML = getTextareaOverlayHTML(
    barSearchBookmarksStorageTextareaEl.value,
    html
  );

  setEditorStatus(barSearchBookmarksStorageStatusEl, errors);
};

export const syncBarSearchBookmarksStorageHighlightScroll = (): void => {
  barSearchBookmarksStorageHighlightEl.scrollTop = barSearchBookmarksStorageTextareaEl.scrollTop;
  barSearchBookmarksStorageHighlightEl.scrollLeft = barSearchBookmarksStorageTextareaEl.scrollLeft;
};