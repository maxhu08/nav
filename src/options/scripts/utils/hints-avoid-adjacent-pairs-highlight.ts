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

  const tokens: string[] = [];
  let hasError = false;

  for (const match of line.matchAll(/\s+|\S+/g)) {
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

  return { hasError, html: tokens.join("") };
};

export const normalizeAvoidAdjacentPairsValue = (value: string): string => {
  return value
    .replaceAll("\r", "")
    .replaceAll(/[^\S\n]+/g, " ")
    .replaceAll(/[^\sa-zA-Z#]/g, " ")
    .replaceAll(/ +\n/g, "\n")
    .replaceAll(/\n +/g, "\n");
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
