export const HINT_CUSTOM_SELECTOR_AUTO_LABEL = "<auto>";

export type HintCustomSelectorEntry = {
  key: string | null;
  selector: string;
};

export type HintCustomSelectorRule = {
  pattern: string;
  entries: HintCustomSelectorEntry[];
};

export type HintCustomSelectorParseError = {
  code:
    | "invalid-block"
    | "missing-pattern"
    | "invalid-pattern"
    | "unexpected-closing-brace"
    | "missing-closing-brace"
    | "empty-block"
    | "invalid-entry"
    | "invalid-key"
    | "duplicate-key"
    | "invalid-selector";
  lineNumber: number | null;
  message: string;
};

const isValidRegexPattern = (value: string): boolean => {
  try {
    void new RegExp(value);
    return true;
  } catch {
    return false;
  }
};

const isValidCssSelector = (value: string): boolean => {
  try {
    document.createDocumentFragment().querySelector(value);
    return true;
  } catch {
    return false;
  }
};

const normalizeKey = (value: string): string | null => {
  if (value === HINT_CUSTOM_SELECTOR_AUTO_LABEL) {
    return null;
  }

  return value.toLowerCase();
};

const isValidCustomSelectorKey = (value: string, minLabelLength: number): boolean => {
  return (
    value === HINT_CUSTOM_SELECTOR_AUTO_LABEL ||
    (/^[a-z]+$/i.test(value) && value.length >= minLabelLength)
  );
};

export const parseHintCustomSelectorsValue = (
  value: string,
  minLabelLength: number
): {
  rules: HintCustomSelectorRule[];
  errors: HintCustomSelectorParseError[];
} => {
  const rules: HintCustomSelectorRule[] = [];
  const errors: HintCustomSelectorParseError[] = [];
  let currentRule: {
    pattern: string;
    entries: HintCustomSelectorEntry[];
    lineNumber: number;
    isPatternValid: boolean;
    seenExplicitKeys: Set<string>;
  } | null = null;

  for (const [index, rawLine] of value.split("\n").entries()) {
    const lineNumber = index + 1;
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      continue;
    }

    if (!currentRule) {
      if (trimmedLine === "}") {
        errors.push({
          code: "unexpected-closing-brace",
          lineNumber,
          message: `line ${lineNumber}: Unexpected closing brace.`
        });
        continue;
      }

      const blockMatch = trimmedLine.match(/^\*\s+(.*?)\s*\{$/);
      if (!blockMatch) {
        errors.push({
          code: "invalid-block",
          lineNumber,
          message: `line ${lineNumber}: Expected "* <regex-pattern> {".`
        });
        continue;
      }

      const pattern = (blockMatch[1] ?? "").trim();
      const isPatternValid = pattern.length > 0 && isValidRegexPattern(pattern);

      if (pattern.length === 0) {
        errors.push({
          code: "missing-pattern",
          lineNumber,
          message: `line ${lineNumber}: Regex pattern cannot be empty.`
        });
      } else if (!isPatternValid) {
        errors.push({
          code: "invalid-pattern",
          lineNumber,
          message: `line ${lineNumber}: Invalid regex pattern "${pattern}".`
        });
      }

      currentRule = {
        pattern,
        entries: [],
        lineNumber,
        isPatternValid,
        seenExplicitKeys: new Set<string>()
      };
      continue;
    }

    if (trimmedLine === "}") {
      if (currentRule.entries.length === 0) {
        errors.push({
          code: "empty-block",
          lineNumber: currentRule.lineNumber,
          message: `line ${currentRule.lineNumber}: Add at least one selector entry to this block.`
        });
      }

      if (currentRule.isPatternValid && currentRule.entries.length > 0) {
        rules.push({
          pattern: currentRule.pattern,
          entries: currentRule.entries
        });
      }

      currentRule = null;
      continue;
    }

    const entryMatch = trimmedLine.match(/^(\S+)\s+(.+)$/);
    if (!entryMatch) {
      errors.push({
        code: "invalid-entry",
        lineNumber,
        message: `line ${lineNumber}: Expected "<key> <css-selector>".`
      });
      continue;
    }

    const rawKey = entryMatch[1] ?? "";
    const selector = (entryMatch[2] ?? "").trim();
    const normalizedKey = normalizeKey(rawKey);
    const normalizedExplicitKey = normalizedKey ?? null;
    const isKeyValid = isValidCustomSelectorKey(rawKey, minLabelLength);
    const isDuplicateKey =
      normalizedExplicitKey !== null && currentRule.seenExplicitKeys.has(normalizedExplicitKey);
    const isSelectorValid = selector.length > 0 && isValidCssSelector(selector);

    if (!isKeyValid) {
      errors.push({
        code: "invalid-key",
        lineNumber,
        message: `line ${lineNumber}: Key must be letters only and at least as long as hints.minLabelLength, or exactly "${HINT_CUSTOM_SELECTOR_AUTO_LABEL}".`
      });
    } else if (isDuplicateKey) {
      errors.push({
        code: "duplicate-key",
        lineNumber,
        message: `line ${lineNumber}: Duplicate custom selector key "${rawKey}" in the same block.`
      });
    }

    if (!isSelectorValid) {
      errors.push({
        code: "invalid-selector",
        lineNumber,
        message: `line ${lineNumber}: Invalid CSS selector "${selector}".`
      });
    }

    if (!isKeyValid || isDuplicateKey || !isSelectorValid) {
      continue;
    }

    if (normalizedExplicitKey !== null) {
      currentRule.seenExplicitKeys.add(normalizedExplicitKey);
    }

    currentRule.entries.push({
      key: normalizedKey,
      selector
    });
  }

  if (currentRule) {
    errors.push({
      code: "missing-closing-brace",
      lineNumber: currentRule.lineNumber,
      message: `line ${currentRule.lineNumber}: Missing closing brace for this block.`
    });
  }

  return { rules, errors };
};