import { rulesUrlsHighlightEl, rulesUrlsTextareaEl } from "~/src/options/scripts/ui";
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

const renderActions = (value: string): string => {
  const tokens: string[] = [];

  for (const token of value.matchAll(/\s+|\S+/g)) {
    const segment = token[0];

    if (/^\s+$/.test(segment)) {
      tokens.push(escapeHtml(segment));
      continue;
    }

    tokens.push(
      wrapToken(
        isActionName(segment) ? "rules-urls-token-action" : "rules-urls-token-invalid",
        segment
      )
    );
  }

  return tokens.join("");
};

const renderLine = (line: string, canAttachActions: boolean): string => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return "";
  }

  if (trimmedLine.startsWith("#")) {
    return wrapToken("rules-urls-token-comment", line);
  }

  const prefix = line[0];

  if (prefix !== "*" && prefix !== "+" && prefix !== "-") {
    return wrapToken("rules-urls-token-invalid", line);
  }

  const rest = line.slice(1);
  const leadingSpaceLength = rest.length - rest.trimStart().length;
  const spacing = rest.slice(0, leadingSpaceLength);
  const value = rest.slice(leadingSpaceLength);

  if (prefix === "*") {
    return [
      wrapToken("rules-urls-token-prefix", prefix),
      escapeHtml(spacing),
      tokenizeRegexPattern(value)
    ].join("");
  }

  if (!canAttachActions) {
    return wrapToken("rules-urls-token-invalid", line);
  }

  return [
    wrapToken("rules-urls-token-operator", prefix),
    escapeHtml(spacing),
    renderActions(value)
  ].join("");
};

export const syncRulesUrlsHighlight = (): void => {
  let previousLineWasRuleStart = false;

  rulesUrlsHighlightEl.innerHTML = rulesUrlsTextareaEl.value
    .split("\n")
    .map((line) => {
      const renderedLine = renderLine(line, previousLineWasRuleStart);
      const trimmedLine = line.trim();

      previousLineWasRuleStart = trimmedLine.startsWith("*");

      return renderedLine;
    })
    .join("\n");
};

export const syncRulesUrlsHighlightScroll = (): void => {
  rulesUrlsHighlightEl.scrollTop = rulesUrlsTextareaEl.scrollTop;
  rulesUrlsHighlightEl.scrollLeft = rulesUrlsTextareaEl.scrollLeft;
};
