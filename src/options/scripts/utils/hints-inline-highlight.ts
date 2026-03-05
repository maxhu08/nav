import {
  hintsCharsetHighlightEl,
  hintsCharsetInputEl,
  hintsCharsetStatusEl,
  hintsPreferredSearchLabelsHighlightEl,
  hintsPreferredSearchLabelsInputEl,
  hintsPreferredSearchLabelsStatusEl
} from "~/src/options/scripts/ui";
import { type EditorStatusError, setEditorStatus } from "~/src/options/scripts/utils/editor-status";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const renderCharsetHighlight = (
  value: string
): { hasError: boolean; html: string; errors: EditorStatusError[] } => {
  const seenCharacters = new Set<string>();
  const uniqueCharacters = new Set<string>();
  const errors: EditorStatusError[] = [];
  let hasError = false;
  let html = "";

  for (const [index, char] of Array.from(value).entries()) {
    const normalizedChar = char.toLowerCase();
    const isValidCharacter = /^[a-z]$/i.test(char);
    const isDuplicate = isValidCharacter && seenCharacters.has(normalizedChar);
    const isSpace = /\s/.test(char);
    const isValid = isValidCharacter && !isDuplicate && !isSpace;

    if (isValidCharacter) {
      seenCharacters.add(normalizedChar);
      uniqueCharacters.add(normalizedChar);
    }

    if (!isValid) {
      hasError = true;

      if (isSpace) {
        errors.push({
          code: "space-character",
          message: `position ${index + 1}: Spaces are not allowed in hints.charset.`
        });
      } else if (!isValidCharacter) {
        errors.push({
          code: "invalid-character",
          message: `position ${index + 1}: "${char}" is not a letter a-z.`
        });
      } else if (isDuplicate) {
        errors.push({
          code: "duplicate-character",
          message: `position ${index + 1}: "${char}" is duplicated.`
        });
      }
    }

    html += wrapToken(isValid ? "hints-inline-token-valid" : "hints-inline-token-invalid", char);
  }

  if (uniqueCharacters.size < 2) {
    hasError = true;
    errors.push({
      code: "insufficient-charset",
      message: "hints.charset must contain at least 2 unique letters."
    });
  }

  return { hasError, html, errors };
};

type PreferredSearchToken = {
  type: "label" | "space";
  value: string;
};

const tokenizePreferredSearchLabels = (value: string): PreferredSearchToken[] =>
  Array.from(value.matchAll(/ +|[^ ]+/g), (match) => {
    const token = match[0] ?? "";
    return {
      type: token.startsWith(" ") ? "space" : "label",
      value: token
    };
  });

const renderPreferredSearchLabelsHighlight = (
  value: string
): { hasError: boolean; html: string; errors: EditorStatusError[] } => {
  const tokens = tokenizePreferredSearchLabels(value);
  const seenLabels = new Set<string>();
  const errors: EditorStatusError[] = [];
  let previousLabelLength: number | null = null;
  let hasError = false;
  let html = "";

  tokens.forEach((token, index) => {
    if (token.type === "space") {
      const isBoundarySpace = index === 0 || index === tokens.length - 1;
      const isSingleSeparator =
        token.value === " " &&
        tokens[index - 1]?.type === "label" &&
        tokens[index + 1]?.type === "label";
      const isValid = !isBoundarySpace && isSingleSeparator;

      if (!isValid) {
        hasError = true;
        errors.push({
          code: "invalid-separator",
          message: `Expected a single space between labels near "${token.value}".`
        });
      }
      html += wrapToken(
        isValid ? "hints-inline-token-separator" : "hints-inline-token-invalid",
        token.value
      );
      return;
    }

    const isValidLabel = /^[a-z]+$/i.test(token.value);
    const hasExpectedLength =
      previousLabelLength === null || token.value.length === previousLabelLength + 1;
    const isDuplicate = isValidLabel && seenLabels.has(token.value.toLowerCase());
    const isValid = isValidLabel && hasExpectedLength && !isDuplicate;

    if (isValidLabel) {
      previousLabelLength = token.value.length;
      seenLabels.add(token.value.toLowerCase());
    }

    if (!isValid) {
      hasError = true;

      if (!isValidLabel) {
        errors.push({
          code: "invalid-label",
          message: `Label "${token.value}" must contain only letters a-z.`
        });
      } else if (!hasExpectedLength) {
        errors.push({
          code: "invalid-label-length",
          message: `Label "${token.value}" must be exactly one character longer than the previous label.`
        });
      } else if (isDuplicate) {
        errors.push({
          code: "duplicate-label",
          message: `Label "${token.value}" is duplicated.`
        });
      }
    }

    html += wrapToken(
      isValid ? "hints-inline-token-valid" : "hints-inline-token-invalid",
      token.value
    );
  });

  if (tokens.filter((token) => token.type === "label").length === 0) {
    hasError = true;
    errors.push({
      code: "missing-labels",
      message: "hints.preferredSearchLabels requires at least one label."
    });
  }

  return { hasError, html, errors };
};

export const syncHintsCharsetHighlight = (): void => {
  const { html, errors } = renderCharsetHighlight(hintsCharsetInputEl.value);
  hintsCharsetHighlightEl.innerHTML = html;
  setEditorStatus(hintsCharsetStatusEl, errors);
};

export const syncHintsCharsetHighlightScroll = (): void => {
  hintsCharsetHighlightEl.scrollLeft = hintsCharsetInputEl.scrollLeft;
};

export const syncHintsPreferredSearchLabelsHighlight = (): void => {
  const { html, errors } = renderPreferredSearchLabelsHighlight(
    hintsPreferredSearchLabelsInputEl.value
  );

  hintsPreferredSearchLabelsHighlightEl.innerHTML = html;
  setEditorStatus(hintsPreferredSearchLabelsStatusEl, errors);
};

export const syncHintsPreferredSearchLabelsHighlightScroll = (): void => {
  hintsPreferredSearchLabelsHighlightEl.scrollLeft = hintsPreferredSearchLabelsInputEl.scrollLeft;
};
