import { deepMerge } from "~/src/utils/deep-merge";
import type { Config } from "~/src/utils/config";
import {
  hasForceNormalModeOption,
  hasReservedLabelsOption
} from "~/src/utils/migrate/config-helpers";

const hasDirective = (reservedLabels: string, directive: string): boolean => {
  return reservedLabels.includes(`@${directive} `);
};

const addDirectiveIfMissing = (config: Config, directive: string, labels: string): void => {
  if (hasDirective(config.hints.reservedLabels, directive)) {
    return;
  }

  const trimmedReservedLabels = config.hints.reservedLabels.trim();
  const directiveLine = `@${directive} ${labels}`;

  if (trimmedReservedLabels.length === 0) {
    config.hints.reservedLabels = directiveLine;
    return;
  }

  config.hints.reservedLabels = `${trimmedReservedLabels}\n${directiveLine}`;
};

const hasHotkeyMapping = (mappings: string, sequence: string, action: string): boolean => {
  return mappings
    .split("\n")
    .map((line) => {
      const commentStartIndex = line.indexOf("#");
      return commentStartIndex === -1 ? line.trim() : line.slice(0, commentStartIndex).trim();
    })
    .some((line) => line === `${sequence} ${action}`);
};

const addHotkeyMappingIfMissing = (config: Config, mapping: string, action: string): void => {
  if (hasHotkeyMapping(config.hotkeys.mappings, mapping, action)) {
    return;
  }

  const trimmedMappings = config.hotkeys.mappings.trimEnd();
  const mappingLine = `${mapping} ${action}`;

  if (trimmedMappings.length === 0) {
    config.hotkeys.mappings = mappingLine;
    return;
  }

  config.hotkeys.mappings = `${trimmedMappings}\n${mappingLine}`;
};

const renameHotkeyMappingIfPresent = (
  mappings: string,
  oldSequence: string,
  oldAction: string,
  newSequence: string,
  newAction: string
): string => {
  return mappings
    .split("\n")
    .map((line) => {
      const commentStartIndex = line.indexOf("#");
      const comment = commentStartIndex === -1 ? "" : line.slice(commentStartIndex);
      const content = commentStartIndex === -1 ? line : line.slice(0, commentStartIndex);
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return line;
      }

      const separatorIndex = trimmedContent.search(/\s/);
      if (separatorIndex === -1) {
        return line;
      }

      const sequence = trimmedContent.slice(0, separatorIndex).trim();
      const action = trimmedContent.slice(separatorIndex).trim();
      if (sequence !== oldSequence || action !== oldAction) {
        return line;
      }

      const leadingWhitespace = content.match(/^\s*/)?.[0] ?? "";
      const trailingWhitespace = content.match(/\s*$/)?.[0] ?? "";
      return `${leadingWhitespace}${newSequence} ${newAction}${trailingWhitespace}${comment}`;
    })
    .join("\n");
};

const getHotkeyMappings = (config: unknown): string => {
  if (typeof config !== "object" || config === null) {
    return "";
  }

  const hotkeys = (config as { hotkeys?: unknown }).hotkeys;
  if (typeof hotkeys !== "object" || hotkeys === null) {
    return "";
  }

  return typeof (hotkeys as { mappings?: unknown }).mappings === "string"
    ? (hotkeys as { mappings: string }).mappings
    : "";
};

export const migrateOldConfig = (config: unknown, fallbackConfig: Config): Config => {
  // if config before v1.0.3
  if (!hasReservedLabelsOption(config)) {
    return structuredClone(fallbackConfig);
  }

  // if config before v1.0.4
  if (!hasForceNormalModeOption(config)) {
    return deepMerge(structuredClone(fallbackConfig), config);
  }

  const migratedConfig = deepMerge(structuredClone(fallbackConfig), config);
  const originalHotkeyMappings = getHotkeyMappings(config);

  // if config before v1.0.6
  addDirectiveIfMissing(migratedConfig, "input", "kj kjf kjfd");

  // if config before v1.0.6
  addDirectiveIfMissing(migratedConfig, "attach", "up");

  // if config before v1.0.8
  addDirectiveIfMissing(migratedConfig, "share", "sh");

  // if config before v1.0.9
  addDirectiveIfMissing(migratedConfig, "login", "si");

  // if config before v1.0.9
  addDirectiveIfMissing(migratedConfig, "download", "dl");

  // if config before v1.1.0
  if (!hasHotkeyMapping(originalHotkeyMappings, "yc", "yank-current-tab-url-clean")) {
    addHotkeyMappingIfMissing(migratedConfig, "yc", "yank-current-tab-url-clean");
  }

  // if config before v1.1.1
  addDirectiveIfMissing(migratedConfig, "microphone", "mic");

  // if config before v1.1.2
  addDirectiveIfMissing(migratedConfig, "delete", "dd");

  // if config before v1.1.2
  addDirectiveIfMissing(migratedConfig, "save", "sv");

  // if config before v1.1.2
  addDirectiveIfMissing(migratedConfig, "copy", "cp");

  // if config before v1.1.2
  addDirectiveIfMissing(migratedConfig, "hide", "hi");

  // if config before v1.1.3
  addDirectiveIfMissing(migratedConfig, "notification", "nf");

  // if config before v1.1.1
  migratedConfig.hotkeys.mappings = renameHotkeyMappingIfPresent(
    migratedConfig.hotkeys.mappings,
    "yb",
    "duplicate-current-tab-base",
    "yo",
    "duplicate-current-tab-origin"
  );

  if (!hasHotkeyMapping(originalHotkeyMappings, "yo", "duplicate-current-tab-origin")) {
    addHotkeyMappingIfMissing(migratedConfig, "yo", "duplicate-current-tab-origin");
  }

  return migratedConfig;
};