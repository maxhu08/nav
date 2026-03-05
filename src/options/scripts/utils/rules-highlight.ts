import {
  rulesUrlsBlacklistHighlightEl,
  rulesUrlsBlacklistStatusEl,
  rulesUrlsBlacklistTextareaEl,
  rulesUrlsWhitelistHighlightEl,
  rulesUrlsWhitelistStatusEl,
  rulesUrlsWhitelistTextareaEl
} from "~/src/options/scripts/ui";
import { type EditorStatusError, setEditorStatus } from "~/src/options/scripts/utils/editor-status";
import { isActionName } from "~/src/utils/hotkeys";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const isValidRegexPattern = (value: string): boolean => {
  try {
    void new RegExp(value);
    return true;
  } catch {
    return false;
  }
};

const createRuleError = (
  code:
    | "invalid-prefix"
    | "missing-pattern"
    | "invalid-pattern"
    | "dangling-operator"
    | "missing-action"
    | "invalid-action",
  lineNumber: number,
  message: string
): EditorStatusError => ({
  code,
  message: `line ${lineNumber}: ${message}`
});

const tokenizeRegexPattern = (value: string): string => {
  const tokens: string[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "\\") {
      const escapeSequence = value.slice(index, Math.min(value.length, index + 2));
      tokens.push(wrapToken("rules-urls-token-regex-escape", escapeSequence));
      index += escapeSequence.length - 1;
      continue;
    }

    if (char === "[") {
      let endIndex = index + 1;

      while (endIndex < value.length) {
        if (value[endIndex] === "\\") {
          endIndex += 2;
          continue;
        }

        if (value[endIndex] === "]") {
          endIndex += 1;
          break;
        }

        endIndex += 1;
      }

      tokens.push(wrapToken("rules-urls-token-regex-class", value.slice(index, endIndex)));
      index = endIndex - 1;
      continue;
    }

    if (char === "(") {
      const groupPrefixes = ["(?:", "(?=", "(?!", "(?<=", "(?<!"];
      const groupPrefix = groupPrefixes.find((prefix) => value.startsWith(prefix, index));

      if (groupPrefix) {
        tokens.push(wrapToken("rules-urls-token-regex-group", groupPrefix));
        index += groupPrefix.length - 1;
        continue;
      }
    }

    if (char === "{") {
      let endIndex = index + 1;

      while (endIndex < value.length && value[endIndex] !== "}") {
        endIndex += 1;
      }

      if (endIndex < value.length && value[endIndex] === "}") {
        endIndex += 1;
      }

      tokens.push(wrapToken("rules-urls-token-regex-quantifier", value.slice(index, endIndex)));
      index = endIndex - 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push(wrapToken("rules-urls-token-regex-group", char));
      continue;
    }

    if (
      char === "*" ||
      char === "+" ||
      char === "?" ||
      char === "|" ||
      char === "^" ||
      char === "$"
    ) {
      tokens.push(wrapToken("rules-urls-token-regex-quantifier", char));
      continue;
    }

    tokens.push(wrapToken("rules-urls-token-regex-pattern", char));
  }

  return tokens.join("");
};

const renderActions = (
  value: string,
  lineNumber: number
): { hasError: boolean; html: string; errors: EditorStatusError[] } => {
  const tokens: string[] = [];
  const errors: EditorStatusError[] = [];
  let hasError = false;
  let hasNonWhitespaceSegment = false;

  for (const token of value.matchAll(/\s+|\S+/g)) {
    const segment = token[0];

    if (/^\s+$/.test(segment)) {
      tokens.push(escapeHtml(segment));
      continue;
    }

    hasNonWhitespaceSegment = true;
    const isValid = isActionName(segment);
    if (!isValid) {
      hasError = true;
      errors.push(createRuleError("invalid-action", lineNumber, `Invalid action "${segment}".`));
    }
    tokens.push(
      wrapToken(isValid ? "rules-urls-token-action" : "rules-urls-token-invalid", segment)
    );
  }

  if (!hasNonWhitespaceSegment) {
    hasError = true;
    errors.push(
      createRuleError("missing-action", lineNumber, "Expected at least one action name.")
    );
  }

  return { hasError, html: tokens.join(""), errors };
};

const renderLine = (
  line: string,
  lineNumber: number,
  canAttachActions: boolean
): { hasError: boolean; html: string; errors: EditorStatusError[] } => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return { hasError: false, html: "", errors: [] };
  }

  if (trimmedLine.startsWith("#")) {
    return { hasError: false, html: wrapToken("rules-urls-token-comment", line), errors: [] };
  }

  const prefix = line[0];

  if (prefix !== "*" && prefix !== "+" && prefix !== "-") {
    return {
      hasError: true,
      html: wrapToken("rules-urls-token-invalid", line),
      errors: [createRuleError("invalid-prefix", lineNumber, `Invalid rule prefix "${prefix}".`)]
    };
  }

  const rest = line.slice(1);
  const leadingSpaceLength = rest.length - rest.trimStart().length;
  const spacing = rest.slice(0, leadingSpaceLength);
  const value = rest.slice(leadingSpaceLength);

  if (prefix === "*") {
    const normalizedPattern = value.trim();
    const errors: EditorStatusError[] = [];

    if (!normalizedPattern) {
      errors.push(createRuleError("missing-pattern", lineNumber, "Regex pattern cannot be empty."));
    } else if (!isValidRegexPattern(normalizedPattern)) {
      errors.push(
        createRuleError(
          "invalid-pattern",
          lineNumber,
          `Invalid regex pattern "${normalizedPattern}".`
        )
      );
    }

    return {
      hasError: errors.length > 0,
      errors,
      html: [
        wrapToken("rules-urls-token-prefix", prefix),
        escapeHtml(spacing),
        tokenizeRegexPattern(value)
      ].join("")
    };
  }

  if (!canAttachActions) {
    return {
      hasError: true,
      html: wrapToken("rules-urls-token-invalid", line),
      errors: [
        createRuleError(
          "dangling-operator",
          lineNumber,
          `Operator "${prefix}" must follow a "*" pattern line.`
        )
      ]
    };
  }

  const renderedActions = renderActions(value, lineNumber);

  return {
    hasError: renderedActions.hasError,
    errors: renderedActions.errors,
    html: [
      wrapToken("rules-urls-token-operator", prefix),
      escapeHtml(spacing),
      renderedActions.html
    ].join("")
  };
};

export const renderRulesUrlsValue = (
  value: string
): {
  hasError: boolean;
  html: string;
  errors: EditorStatusError[];
} => {
  let previousLineWasRuleStart = false;
  let hasError = false;
  const errors: EditorStatusError[] = [];

  const html = value
    .split("\n")
    .map((line, index) => {
      const renderedLine = renderLine(line, index + 1, previousLineWasRuleStart);
      const trimmedLine = line.trim();

      previousLineWasRuleStart = trimmedLine.startsWith("*");
      hasError ||= renderedLine.hasError;
      errors.push(...renderedLine.errors);

      return renderedLine.html;
    })
    .join("\n");

  return {
    hasError,
    html,
    errors
  };
};

const syncRulesUrlsEditorHighlight = (
  textareaEl: HTMLTextAreaElement,
  highlightEl: HTMLPreElement,
  statusEl: HTMLParagraphElement
): void => {
  const renderedValue = renderRulesUrlsValue(textareaEl.value);

  highlightEl.innerHTML = renderedValue.html;
  setEditorStatus(statusEl, renderedValue.errors);
};

export const syncRulesUrlsHighlight = (): void => {
  syncRulesUrlsEditorHighlight(
    rulesUrlsBlacklistTextareaEl,
    rulesUrlsBlacklistHighlightEl,
    rulesUrlsBlacklistStatusEl
  );
  syncRulesUrlsEditorHighlight(
    rulesUrlsWhitelistTextareaEl,
    rulesUrlsWhitelistHighlightEl,
    rulesUrlsWhitelistStatusEl
  );
};

export const syncRulesUrlsHighlightScroll = (): void => {
  rulesUrlsBlacklistHighlightEl.scrollTop = rulesUrlsBlacklistTextareaEl.scrollTop;
  rulesUrlsBlacklistHighlightEl.scrollLeft = rulesUrlsBlacklistTextareaEl.scrollLeft;
  rulesUrlsWhitelistHighlightEl.scrollTop = rulesUrlsWhitelistTextareaEl.scrollTop;
  rulesUrlsWhitelistHighlightEl.scrollLeft = rulesUrlsWhitelistTextareaEl.scrollLeft;
};
