import {
  hintsCharsetHighlightEl,
  hintsCharsetInputEl,
  hintsCharsetStatusEl,
  hintsCustomSelectorsHighlightEl,
  hintsCustomSelectorsStatusEl,
  hintsCustomSelectorsTextareaEl,
  hintsMinLabelLengthInputEl,
  hintsReservedLabelsHighlightEl,
  hintsReservedLabelsStatusEl,
  hintsReservedLabelsTextareaEl
} from "~/src/options/scripts/ui";
import { getTextareaOverlayHTML } from "~/src/options/scripts/utils/editor-highlight";
import { tokenizeCssSelectorValue } from "~/src/options/scripts/utils/hints-custom-css-highlight";
import { tokenizeRegexPattern } from "~/src/options/scripts/utils/rules-highlight";
import { type EditorStatusError, setEditorStatus } from "~/src/options/scripts/utils/editor-status";
import {
  normalizeReservedHintDirective,
  RESERVED_HINT_DIRECTIVES,
  RESERVED_HINT_DIRECTIVE_LINE_PATTERN,
  RESERVED_HINT_UNBOUND_LABEL
} from "~/src/utils/hint-reserved-label-directives";
import { parseHintCustomSelectorsValue } from "~/src/utils/hint-custom-selectors";

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

const renderReservedLabelsHighlight = (
  value: string
): { hasError: boolean; html: string; errors: EditorStatusError[] } => {
  const errors: EditorStatusError[] = [];
  const seenDirectives = new Set<string>();
  let hasError = false;

  const html = value
    .split("\n")
    .map((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return "";
      }

      if (trimmedLine.startsWith("#")) {
        return wrapToken("hints-reserved-labels-token-comment", line);
      }

      if (line !== trimmedLine) {
        hasError = true;
        errors.push({
          code: "invalid-spacing",
          message: `line ${lineNumber}: Remove leading or trailing spaces.`
        });
        return wrapToken("hints-reserved-labels-token-invalid", line);
      }

      const match = line.match(RESERVED_HINT_DIRECTIVE_LINE_PATTERN);
      if (!match) {
        hasError = true;
        errors.push({
          code: "invalid-format",
          message: `line ${lineNumber}: Expected format "@element label1 label2 label3" with single spaces.`
        });
        return wrapToken("hints-reserved-labels-token-invalid", line);
      }

      const directiveValue = (match[1] ?? "").toLowerCase();
      const directive = normalizeReservedHintDirective(directiveValue);
      const labelsValue = (match[2] ?? "").toLowerCase();
      const labels = labelsValue.split(" ");

      if (!directive) {
        hasError = true;
        errors.push({
          code: "invalid-directive",
          message: `line ${lineNumber}: Unknown directive "@${directiveValue}". See docs#directive-names for valid directives.`
        });
      }

      if (directive && seenDirectives.has(directive)) {
        hasError = true;
        errors.push({
          code: "duplicate-directive",
          message: `line ${lineNumber}: Duplicate "@${directive}" directive.`
        });
      }
      if (directive) {
        seenDirectives.add(directive);
      }

      const seenLabels = new Set<string>();
      let previousLabelLength: number | null = null;
      const isUnboundDirective = labelsValue === RESERVED_HINT_UNBOUND_LABEL;
      const labelTokens = labels.map((label) => {
        const normalizedLabel = label.toLowerCase();
        const isValidLabel = isUnboundDirective
          ? label === RESERVED_HINT_UNBOUND_LABEL
          : /^[a-z]+$/i.test(label);
        const hasExpectedLength =
          isUnboundDirective ||
          previousLabelLength === null ||
          label.length === previousLabelLength + 1;
        const isDuplicate = seenLabels.has(normalizedLabel);
        const isValid = isValidLabel && hasExpectedLength && !isDuplicate;

        if (isValidLabel && !isUnboundDirective) {
          seenLabels.add(normalizedLabel);
          previousLabelLength = label.length;
        }

        if (!isValid) {
          hasError = true;

          if (!isValidLabel) {
            errors.push({
              code: "invalid-label",
              message: `line ${lineNumber}: Label "${label}" must contain only letters a-z, or be exactly "${RESERVED_HINT_UNBOUND_LABEL}".`
            });
          } else if (!hasExpectedLength) {
            errors.push({
              code: "invalid-label-length",
              message: `line ${lineNumber}: Label "${label}" must be exactly one character longer than the previous label.`
            });
          } else if (isDuplicate) {
            errors.push({
              code: "duplicate-label",
              message: `line ${lineNumber}: Label "${label}" is duplicated.`
            });
          }
        }

        return wrapToken(
          isValid ? "hints-reserved-labels-token-valid" : "hints-reserved-labels-token-invalid",
          label
        );
      });

      return [
        wrapToken("hints-reserved-labels-token-directive", `@${directiveValue}`),
        wrapToken("hints-reserved-labels-token-separator", " "),
        labelTokens.join(wrapToken("hints-reserved-labels-token-separator", " "))
      ].join("");
    })
    .join("\n");

  for (const directive of RESERVED_HINT_DIRECTIVES) {
    if (seenDirectives.has(directive)) {
      continue;
    }

    hasError = true;
    errors.push({
      code: "missing-directive",
      message: `Missing "@${directive}" directive. Use "@${directive} <unbound>" if it should stay unbound.`
    });
  }

  return { hasError, html, errors };
};

const renderCustomSelectorsHighlight = (
  value: string,
  minLabelLength: number
): { hasError: boolean; html: string; errors: EditorStatusError[] } => {
  const parsedValue = parseHintCustomSelectorsValue(value, minLabelLength);
  const errorsByLine = new Map<number, string[]>();

  for (const error of parsedValue.errors) {
    if (error.lineNumber === null) {
      continue;
    }

    const lineErrors = errorsByLine.get(error.lineNumber) ?? [];
    lineErrors.push(error.message);
    errorsByLine.set(error.lineNumber, lineErrors);
  }

  let insideBlock = false;
  const html = value
    .split("\n")
    .map((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      const lineHasError = (errorsByLine.get(lineNumber)?.length ?? 0) > 0;

      if (!trimmedLine) {
        return "";
      }

      if (!insideBlock) {
        const blockMatch = trimmedLine.match(/^\*\s+(.*?)\s*\{$/);
        insideBlock = !!blockMatch;

        if (!blockMatch || lineHasError) {
          return wrapToken("hints-custom-selectors-token-invalid", line);
        }

        const leadingWhitespace = line.match(/^\s*/)?.[0] ?? "";
        const trailingWhitespace = line.match(/\s*$/)?.[0] ?? "";
        const pattern = (blockMatch[1] ?? "").trim();
        return [
          escapeHtml(leadingWhitespace),
          wrapToken("hints-custom-selectors-token-operator", "*"),
          wrapToken("hints-custom-selectors-token-separator", " "),
          tokenizeRegexPattern(pattern),
          wrapToken("hints-custom-selectors-token-separator", " "),
          wrapToken("hints-custom-selectors-token-brace", "{"),
          escapeHtml(trailingWhitespace)
        ].join("");
      }

      if (trimmedLine === "}") {
        insideBlock = false;
        return wrapToken(
          lineHasError
            ? "hints-custom-selectors-token-invalid"
            : "hints-custom-selectors-token-brace",
          line
        );
      }

      const entryMatch = trimmedLine.match(/^(\S+)\s+(.+)$/);
      if (!entryMatch || lineHasError) {
        return wrapToken("hints-custom-selectors-token-invalid", line);
      }

      const leadingWhitespace = line.match(/^\s*/)?.[0] ?? "";
      const trailingWhitespace = line.match(/\s*$/)?.[0] ?? "";
      const key = entryMatch[1] ?? "";
      const selector = (entryMatch[2] ?? "").trim();
      return [
        escapeHtml(leadingWhitespace),
        wrapToken("hotkeys-mappings-token-sequence", key),
        wrapToken("hints-custom-selectors-token-separator", " "),
        tokenizeCssSelectorValue(selector),
        escapeHtml(trailingWhitespace)
      ].join("");
    })
    .join("\n");

  return {
    hasError: parsedValue.errors.length > 0,
    html,
    errors: parsedValue.errors.map((error) => ({
      code: error.code,
      message: error.message
    }))
  };
};

export const syncHintsCharsetHighlight = (): void => {
  const result = renderCharsetHighlight(hintsCharsetInputEl.value);
  hintsCharsetHighlightEl.innerHTML = result.html;
  setEditorStatus(hintsCharsetStatusEl, result.errors);
};

export const syncHintsCharsetHighlightScroll = (): void => {
  hintsCharsetHighlightEl.scrollLeft = hintsCharsetInputEl.scrollLeft;
};

export const syncHintsReservedLabelsHighlight = (): void => {
  const result = renderReservedLabelsHighlight(hintsReservedLabelsTextareaEl.value);
  hintsReservedLabelsHighlightEl.innerHTML = getTextareaOverlayHTML(
    hintsReservedLabelsTextareaEl.value,
    result.html
  );
  setEditorStatus(hintsReservedLabelsStatusEl, result.errors);
};

export const syncHintsReservedLabelsHighlightScroll = (): void => {
  hintsReservedLabelsHighlightEl.scrollTop = hintsReservedLabelsTextareaEl.scrollTop;
  hintsReservedLabelsHighlightEl.scrollLeft = hintsReservedLabelsTextareaEl.scrollLeft;
};

export const syncHintsCustomSelectorsHighlight = (): void => {
  const minLabelLength = Math.max(1, Number.parseInt(hintsMinLabelLengthInputEl.value, 10) || 2);
  const result = renderCustomSelectorsHighlight(
    hintsCustomSelectorsTextareaEl.value,
    minLabelLength
  );
  hintsCustomSelectorsHighlightEl.innerHTML = getTextareaOverlayHTML(
    hintsCustomSelectorsTextareaEl.value,
    result.html
  );
  setEditorStatus(hintsCustomSelectorsStatusEl, result.errors);
};

export const syncHintsCustomSelectorsHighlightScroll = (): void => {
  hintsCustomSelectorsHighlightEl.scrollTop = hintsCustomSelectorsTextareaEl.scrollTop;
  hintsCustomSelectorsHighlightEl.scrollLeft = hintsCustomSelectorsTextareaEl.scrollLeft;
};