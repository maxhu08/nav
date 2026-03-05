import {
  hintsAvoidAdjacentPairsHighlightEl,
  hintsAvoidAdjacentPairsStatusEl,
  hintsAvoidAdjacentPairsTextareaEl
} from "~/src/options/scripts/ui";
import { setEditorStatus } from "~/src/options/scripts/utils/editor-status";

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
      html: wrapToken("hints-avoid-adjacent-pairs-token-comment", line)
    };
  }

  const commentStartIndex = line.indexOf("#");
  const lineWithoutComment = commentStartIndex === -1 ? line : line.slice(0, commentStartIndex);
  const inlineComment = commentStartIndex === -1 ? "" : line.slice(commentStartIndex);
  const tokens: string[] = [];
  let hasError = false;

  for (const match of lineWithoutComment.matchAll(/\s+|\S+/g)) {
    const segment = match[0];

    if (/^\s+$/.test(segment)) {
      tokens.push(escapeHtml(segment));
      continue;
    }

    const isValid = /^[a-z]{2}$/i.test(segment);
    hasError ||= !isValid;
    tokens.push(
      wrapToken(
        isValid
          ? "hints-avoid-adjacent-pairs-token-valid"
          : "hints-avoid-adjacent-pairs-token-invalid",
        segment
      )
    );
  }

  if (inlineComment) {
    tokens.push(wrapToken("hints-avoid-adjacent-pairs-token-comment", inlineComment));
  }

  return { hasError, html: tokens.join("") };
};

export const syncHintsAvoidAdjacentPairsHighlight = (): void => {
  let hasError = false;

  hintsAvoidAdjacentPairsHighlightEl.innerHTML = hintsAvoidAdjacentPairsTextareaEl.value
    .split("\n")
    .map((line) => {
      const result = renderLine(line);
      hasError ||= result.hasError;
      return result.html;
    })
    .join("\n");

  setEditorStatus(hintsAvoidAdjacentPairsStatusEl, hasError);
};

export const syncHintsAvoidAdjacentPairsHighlightScroll = (): void => {
  hintsAvoidAdjacentPairsHighlightEl.scrollTop = hintsAvoidAdjacentPairsTextareaEl.scrollTop;
  hintsAvoidAdjacentPairsHighlightEl.scrollLeft = hintsAvoidAdjacentPairsTextareaEl.scrollLeft;
};
