import {
  DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR,
  DEFAULT_HINT_CUSTOM_CSS,
  type Config,
  getConfig
} from "~/src/utils/config";
import {
  type ActionName,
  DEFAULT_HINT_CHARSET,
  type HotkeyActionMode,
  type HotkeyMappings,
  isActionName,
  parseHotkeyMappingsValue
} from "~/src/utils/hotkeys";
import {
  type ReservedHintLabels,
  isReservedHintLabelsShapeValid,
  normalizeReservedHintLabels,
  parseReservedHintDirectives
} from "~/src/utils/hint-reserved-label-directives";

export type FastRule = {
  pattern: string;
  mode: "allow" | "deny";
  actions: Partial<Record<ActionName, true>>;
};

export type FastConfig = {
  rules: {
    forceNormalMode: boolean;
    urls: {
      mode: "blacklist" | "whitelist";
      blacklist: FastRule[];
      whitelist: FastRule[];
    };
  };
  hotkeys: {
    mappings: HotkeyMappings;
    prefixes: Partial<Record<string, true>>;
  };
  hints: {
    showCapitalizedLetters: boolean;
    improveThumbnailMarkers: boolean;
    minLabelLength: number;
    activationIndicator: {
      enabled: boolean;
      color: string;
    };
    css: string;
    charset: string;
    avoidAdjacentPairs: Partial<Record<string, Partial<Record<string, true>>>>;
    directives: ReservedHintLabels;
  };
};

const HOTKEY_ACTION_MODES: HotkeyActionMode[] = ["normal", "find", "watch"];
const isHotkeyMappingsShapeValid = (value: unknown): value is HotkeyMappings => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  for (const bindings of Object.values(value as Record<string, unknown>)) {
    if (typeof bindings !== "object" || bindings === null) {
      return false;
    }

    for (const [mode, action] of Object.entries(bindings as Record<string, unknown>)) {
      if (!HOTKEY_ACTION_MODES.includes(mode as HotkeyActionMode)) {
        return false;
      }

      if (typeof action !== "string" || !isActionName(action)) {
        return false;
      }
    }
  }

  return true;
};

const isFastConfigShapeValid = (value: FastConfig | undefined): value is FastConfig => {
  return (
    typeof value?.rules?.forceNormalMode === "boolean" &&
    isHotkeyMappingsShapeValid(value?.hotkeys?.mappings) &&
    typeof value?.hotkeys?.prefixes === "object" &&
    value?.hotkeys?.prefixes !== null &&
    typeof value?.hints?.showCapitalizedLetters === "boolean" &&
    typeof value?.hints?.improveThumbnailMarkers === "boolean" &&
    typeof value?.hints?.minLabelLength === "number" &&
    typeof value?.hints?.activationIndicator?.enabled === "boolean" &&
    typeof value?.hints?.activationIndicator?.color === "string" &&
    typeof value?.hints?.css === "string" &&
    typeof value?.hints?.charset === "string" &&
    typeof value?.hints?.avoidAdjacentPairs === "object" &&
    value?.hints?.avoidAdjacentPairs !== null &&
    isReservedHintLabelsShapeValid(value?.hints?.directives)
  );
};

const resolveHintCSS = (config: Config): string => {
  return config.hints.styling === "default" ? DEFAULT_HINT_CUSTOM_CSS : config.hints.customCSS;
};

const colorParsingContext = document.createElement("canvas").getContext("2d");

const normalizeCssColor = (value: string): string | null => {
  if (!colorParsingContext) return null;

  colorParsingContext.fillStyle = "#000000";
  colorParsingContext.fillStyle = value;

  return colorParsingContext.fillStyle.toLowerCase() || null;
};

const parseActivationIndicatorColorValue = (value: string): string => {
  return normalizeCssColor(value.trim()) || DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR;
};

const parseMinLabelLengthValue = (value: number): number => {
  return Number.isInteger(value) && value >= 1 ? value : 2;
};

const createHotkeyPrefixes = (mappings: HotkeyMappings): Partial<Record<string, true>> => {
  const prefixes: Partial<Record<string, true>> = {};

  for (const [sequence, bindings] of Object.entries(mappings)) {
    if (!bindings || Object.keys(bindings).length === 0) {
      continue;
    }

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
    const commentStartIndex = line.indexOf("#");
    const lineWithoutComment = commentStartIndex === -1 ? line : line.slice(0, commentStartIndex);
    const trimmedLine = lineWithoutComment.trim();

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

const parseDirectivesValue = (value: unknown): FastConfig["hints"]["directives"] => {
  return normalizeReservedHintLabels(
    parseReservedHintDirectives(typeof value === "string" ? value : "")
  );
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
  const parsedMappings = parseHotkeyMappingsValue(config.hotkeys.mappings);
  const mappings = parsedMappings.mappings;

  return {
    rules: {
      forceNormalMode: config.rules.forceNormalMode,
      urls: {
        mode: config.rules.urls.mode,
        blacklist: parseRulesUrlsValue(config.rules.urls.blacklist),
        whitelist: parseRulesUrlsValue(config.rules.urls.whitelist)
      }
    },
    hotkeys: {
      mappings,
      prefixes: createHotkeyPrefixes(mappings)
    },
    hints: {
      showCapitalizedLetters: config.hints.showCapitalizedLetters,
      improveThumbnailMarkers: config.hints.improveThumbnailMarkers,
      minLabelLength: parseMinLabelLengthValue(config.hints.minLabelLength),
      activationIndicator: {
        enabled: config.hints.activationIndicator.enabled,
        color: parseActivationIndicatorColorValue(config.hints.activationIndicator.color)
      },
      css: resolveHintCSS(config),
      charset: parseHintCharsetValue(config.hints.charset),
      avoidAdjacentPairs: parseAvoidAdjacentPairsValue(config.hints.avoidAdjacentPairs),
      directives: parseDirectivesValue(config.hints.directives)
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