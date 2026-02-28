import { type Config, getConfig } from "~/src/utils/config";
import {
  type ActionName,
  DEFAULT_HINT_CHARSET,
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
    hints: {
      charset: string;
    };
  };
};

const isFastConfigShapeValid = (value: FastConfig | undefined): value is FastConfig => {
  return typeof value?.hotkeys?.hints?.charset === "string";
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
      prefixes: createHotkeyPrefixes(mappings),
      hints: {
        charset: parseHintCharsetValue(config.hotkeys.hints.charset)
      }
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
