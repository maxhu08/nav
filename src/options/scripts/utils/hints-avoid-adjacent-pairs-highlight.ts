import {
  hintsAvoidAdjacentPairsHighlightEl,
  hintsAvoidAdjacentPairsStatusEl,
  hintsAvoidAdjacentPairsTextareaEl
} from "~/src/options/scripts/ui";
import { getTextareaOverlayHTML } from "~/src/options/scripts/utils/editor-highlight";
import { type EditorStatusError, setEditorStatus } from "~/src/options/scripts/utils/editor-status";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const renderLine = (
  line: string,
  lineNumber: number,
  seenPairs: Set<string>
): { hasError: boolean; html: string; errors: EditorStatusError[] } => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return { hasError: false, html: "", errors: [] };
  }

  if (trimmedLine.startsWith("#")) {
    return {
      hasError: false,
      html: wrapToken("hints-avoid-adjacent-pairs-token-comment", line),
      errors: []
    };
  }

  const commentStartIndex = line.indexOf("#");
  const lineWithoutComment = commentStartIndex === -1 ? line : line.slice(0, commentStartIndex);
  const inlineComment = commentStartIndex === -1 ? "" : line.slice(commentStartIndex);
  const tokens: string[] = [];
  const errors: EditorStatusError[] = [];
  let hasError = false;

  for (const match of lineWithoutComment.matchAll(/\s+|\S+/g)) {
    const segment = match[0];

    if (/^\s+$/.test(segment)) {
      tokens.push(escapeHtml(segment));
      continue;
    }

    const isValidPair = /^[a-z]{2}$/i.test(segment);
    const normalizedSegment = segment.toLowerCase();
    const isDuplicate = isValidPair && seenPairs.has(normalizedSegment);
    const isValid = isValidPair && !isDuplicate;

    if (isValidPair) {
      seenPairs.add(normalizedSegment);
    }

    if (!isValid) {
      hasError = true;
      if (!isValidPair) {
        errors.push({
          code: "invalid-pair",
          message: `line ${lineNumber}: "${segment}" must be exactly 2 letters (a-z).`
        });
      } else if (isDuplicate) {
        errors.push({
          code: "duplicate-pair",
          message: `line ${lineNumber}: "${segment}" is duplicated.`
        });
      }
    }

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

  return { hasError, html: tokens.join(""), errors };
};

export const syncHintsAvoidAdjacentPairsHighlight = (): void => {
  const seenPairs = new Set<string>();
  const errors: EditorStatusError[] = [];

  const html = hintsAvoidAdjacentPairsTextareaEl.value
    .split("\n")
    .map((line, index) => {
      const result = renderLine(line, index + 1, seenPairs);
      errors.push(...result.errors);
      return result.html;
    })
    .join("\n");

  hintsAvoidAdjacentPairsHighlightEl.innerHTML = getTextareaOverlayHTML(
    hintsAvoidAdjacentPairsTextareaEl.value,
    html
  );

  setEditorStatus(hintsAvoidAdjacentPairsStatusEl, errors);
};

export const syncHintsAvoidAdjacentPairsHighlightScroll = (): void => {
  hintsAvoidAdjacentPairsHighlightEl.scrollTop = hintsAvoidAdjacentPairsTextareaEl.scrollTop;
  hintsAvoidAdjacentPairsHighlightEl.scrollLeft = hintsAvoidAdjacentPairsTextareaEl.scrollLeft;
};