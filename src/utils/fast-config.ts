import { type Config, getConfig } from "~/src/utils/config";
import {
  type ActionName,
  DEFAULT_HINT_CHARSET,
  DEFAULT_HINT_PREFERRED_SEARCH_LABELS,
  DEFAULT_HOTKEY_MAPPINGS,
  isActionName
} from "~/src/utils/hotkeys";

export type FastRule = {
  pattern: string;
  mode: "allow" | "deny";
  actions: Partial<Record<ActionName, true>>;
};

export type FastConfig = {
  rules: {
    urls: FastRule[];
  };
  hotkeys: {
    mappings: Partial<Record<string, ActionName>>;
    prefixes: Partial<Record<string, true>>;
  };
  hints: {
    showCapitalizedLetters: boolean;
    showActivationIndicator: boolean;
    charset: string;
    avoidAdjacentPairs: Partial<Record<string, Partial<Record<string, true>>>>;
    preferredSearchLabels: string[];
  };
};

const isFastConfigShapeValid = (value: FastConfig | undefined): value is FastConfig => {
  return (
    typeof value?.hints?.showCapitalizedLetters === "boolean" &&
    typeof value?.hints?.showActivationIndicator === "boolean" &&
    typeof value?.hints?.charset === "string" &&
    typeof value?.hints?.avoidAdjacentPairs === "object" &&
    value?.hints?.avoidAdjacentPairs !== null &&
    Array.isArray(value?.hints?.preferredSearchLabels)
  );
};

const parseHotkeyMappingsValue = (value: string): Partial<Record<string, ActionName>> => {
  const parsedMappings: Partial<Record<string, ActionName>> = {};

  for (const line of value.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.search(/\s/);

    if (separatorIndex === -1) {
      continue;
    }

    const sequence = trimmedLine.slice(0, separatorIndex);
    const actionName = trimmedLine.slice(separatorIndex).trim();

    if (!sequence || !isActionName(actionName)) {
      continue;
    }

    parsedMappings[sequence] = actionName;
  }

  return Object.keys(parsedMappings).length > 0
    ? parsedMappings
    : parseHotkeyMappingsValue(DEFAULT_HOTKEY_MAPPINGS);
};

const createHotkeyPrefixes = (
  mappings: Partial<Record<string, ActionName>>
): Partial<Record<string, true>> => {
  const prefixes: Partial<Record<string, true>> = {};

  for (const sequence of Object.keys(mappings)) {
    for (let index = 1; index < sequence.length; index += 1) {
      prefixes[sequence.slice(0, index)] = true;
    }
  }

  return prefixes;
};

const parseHintCharsetValue = (value: string): string => {
  const uniqueCharacters = new Set<string>();
  let normalized = "";

  for (const char of value.toLowerCase()) {
    if (!/[a-z]/.test(char) || uniqueCharacters.has(char)) {
      continue;
    }

    uniqueCharacters.add(char);
    normalized += char;
  }

  return normalized.length >= 2 ? normalized : DEFAULT_HINT_CHARSET;
};

const parseAvoidAdjacentPairsValue = (
  value: string
): Partial<Record<string, Partial<Record<string, true>>>> => {
  const normalizedPairs: Partial<Record<string, Partial<Record<string, true>>>> = {};

  for (const line of value.toLowerCase().split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    for (const segment of trimmedLine.split(/\s+/).map((part) => part.trim())) {
      if (!/^[a-z]{2}$/.test(segment)) {
        continue;
      }

      const previousChar = segment[0];
      const nextChar = segment[1];

      if (!previousChar || !nextChar) {
        continue;
      }

      normalizedPairs[previousChar] ??= {};
      normalizedPairs[previousChar]![nextChar] = true;
    }
  }

  return normalizedPairs;
};

const parsePreferredSearchLabelsValue = (value: string): string[] => {
  const normalizedLabels: string[] = [];
  const seenLabels = new Set<string>();
  let previousLabelLength: number | null = null;

  for (const segment of value
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())) {
    const hasExpectedLength =
      previousLabelLength === null || segment.length === previousLabelLength + 1;

    if (!/^[a-z]+$/.test(segment) || seenLabels.has(segment) || !hasExpectedLength) {
      continue;
    }

    seenLabels.add(segment);
    normalizedLabels.push(segment);
    previousLabelLength = segment.length;
  }

  return normalizedLabels.length > 0
    ? normalizedLabels
    : parsePreferredSearchLabelsValue(DEFAULT_HINT_PREFERRED_SEARCH_LABELS);
};

const parseActions = (value: string): Partial<Record<ActionName, true>> => {
  const actions: Partial<Record<ActionName, true>> = {};

  for (const segment of value.trim().split(/\s+/)) {
    if (isActionName(segment)) {
      actions[segment] = true;
    }
  }

  return actions;
};

const isValidRegexPattern = (value: string): boolean => {
  try {
    void new RegExp(value);
    return true;
  } catch {
    return false;
  }
};

const parseRulesUrlsValue = (value: string): FastRule[] => {
  const urls: FastRule[] = [];
  let previousRule: FastRule | null = null;

  for (const line of value.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      previousRule = null;
      continue;
    }

    const prefix = line[0];
    const rest = line.slice(1).trim();

    if (prefix === "*") {
      if (!rest || !isValidRegexPattern(rest)) {
        previousRule = null;
        continue;
      }

      previousRule = {
        pattern: rest,
        mode: "allow",
        actions: {}
      };
      urls.push(previousRule);
      continue;
    }

    if ((prefix === "+" || prefix === "-") && previousRule) {
      previousRule.mode = prefix === "+" ? "allow" : "deny";
      previousRule.actions = parseActions(rest);
      previousRule = null;
      continue;
    }

    previousRule = null;
  }

  return urls;
};

export const buildFastConfig = (config: Config): FastConfig => {
  const mappings = parseHotkeyMappingsValue(config.hotkeys.mappings);

  return {
    rules: {
      urls: parseRulesUrlsValue(config.rules.urls)
    },
    hotkeys: {
      mappings,
      prefixes: createHotkeyPrefixes(mappings)
    },
    hints: {
      showCapitalizedLetters: config.hints.showCapitalizedLetters,
      showActivationIndicator: config.hints.showActivationIndicator,
      charset: parseHintCharsetValue(config.hints.charset),
      avoidAdjacentPairs: parseAvoidAdjacentPairsValue(config.hints.avoidAdjacentPairs),
      preferredSearchLabels: parsePreferredSearchLabelsValue(config.hints.preferredSearchLabels)
    }
  };
};

export const getFastConfig = (): Promise<FastConfig> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["fastConfig"], async (data) => {
      const fastConfig = data.fastConfig as FastConfig | undefined;

      if (isFastConfigShapeValid(fastConfig)) {
        resolve(fastConfig);
        return;
      }

      const config = await getConfig();
      const nextFastConfig = buildFastConfig(config);

      chrome.storage.local.set({ fastConfig: nextFastConfig }, () => resolve(nextFastConfig));
    });
  });
};
