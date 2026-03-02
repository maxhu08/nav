import {
  rulesUrlsHighlightEl,
  rulesUrlsStatusEl,
  rulesUrlsTextareaEl
} from "~/src/options/scripts/ui";
import { setEditorStatus } from "~/src/options/scripts/utils/editor-status";
import { isActionName } from "~/src/utils/hotkeys";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

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

const renderActions = (value: string): { hasError: boolean; html: string } => {
  const tokens: string[] = [];
  let hasError = false;

  for (const token of value.matchAll(/\s+|\S+/g)) {
    const segment = token[0];

    if (/^\s+$/.test(segment)) {
      tokens.push(escapeHtml(segment));
      continue;
    }

    const isValid = isActionName(segment);
    hasError ||= !isValid;
    tokens.push(
      wrapToken(isValid ? "rules-urls-token-action" : "rules-urls-token-invalid", segment)
    );
  }

  return { hasError, html: tokens.join("") };
};

const renderLine = (
  line: string,
  canAttachActions: boolean
): { hasError: boolean; html: string } => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return { hasError: false, html: "" };
  }

  if (trimmedLine.startsWith("#")) {
    return { hasError: false, html: wrapToken("rules-urls-token-comment", line) };
  }

  const prefix = line[0];

  if (prefix !== "*" && prefix !== "+" && prefix !== "-") {
    return { hasError: true, html: wrapToken("rules-urls-token-invalid", line) };
  }

  const rest = line.slice(1);
  const leadingSpaceLength = rest.length - rest.trimStart().length;
  const spacing = rest.slice(0, leadingSpaceLength);
  const value = rest.slice(leadingSpaceLength);

  if (prefix === "*") {
    return {
      hasError: false,
      html: [
        wrapToken("rules-urls-token-prefix", prefix),
        escapeHtml(spacing),
        tokenizeRegexPattern(value)
      ].join("")
    };
  }

  if (!canAttachActions) {
    return { hasError: true, html: wrapToken("rules-urls-token-invalid", line) };
  }

  const renderedActions = renderActions(value);

  return {
    hasError: renderedActions.hasError,
    html: [
      wrapToken("rules-urls-token-operator", prefix),
      escapeHtml(spacing),
      renderedActions.html
    ].join("")
  };
};

export const syncRulesUrlsHighlight = (): void => {
  let previousLineWasRuleStart = false;
  let hasError = false;

  rulesUrlsHighlightEl.innerHTML = rulesUrlsTextareaEl.value
    .split("\n")
    .map((line) => {
      const renderedLine = renderLine(line, previousLineWasRuleStart);
      const trimmedLine = line.trim();

      previousLineWasRuleStart = trimmedLine.startsWith("*");
      hasError ||= renderedLine.hasError;

      return renderedLine.html;
    })
    .join("\n");

  setEditorStatus(rulesUrlsStatusEl, hasError);
};

export const syncRulesUrlsHighlightScroll = (): void => {
  rulesUrlsHighlightEl.scrollTop = rulesUrlsTextareaEl.scrollTop;
  rulesUrlsHighlightEl.scrollLeft = rulesUrlsTextareaEl.scrollLeft;
};
