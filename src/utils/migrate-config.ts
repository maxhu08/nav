import { deepMerge } from "~/src/utils/deep-merge";
import type { Config } from "~/src/utils/config";
import {
  hasForceNormalModeOption,
  hasReservedLabelsOption
} from "~/src/utils/migrate/config-helpers";

const hasDirective = (reservedLabels: string, directive: string): boolean => {
  return reservedLabels.includes(`@${directive} `);
};

const addDirectiveIfMissing = (
  reservedLabels: string,
  directive: string,
  label: string
): string => {
  if (hasDirective(reservedLabels, directive)) {
    return reservedLabels;
  }

  const trimmedReservedLabels = reservedLabels.trim();
  const directiveLine = `@${directive} ${label}`;

  if (trimmedReservedLabels.length === 0) {
    return directiveLine;
  }

  return `${trimmedReservedLabels}\n${directiveLine}`;
};

const getReservedLabels = (config: unknown): string => {
  if (typeof config !== "object" || config === null) {
    return "";
  }

  const hints = (config as { hints?: unknown }).hints;
  if (typeof hints !== "object" || hints === null) {
    return "";
  }

  return typeof (hints as { reservedLabels?: unknown }).reservedLabels === "string"
    ? (hints as { reservedLabels: string }).reservedLabels
    : "";
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

const addHotkeyMappingIfMissing = (mappings: string, sequence: string, action: string): string => {
  if (hasHotkeyMapping(mappings, sequence, action)) {
    return mappings;
  }

  const trimmedMappings = mappings.trimEnd();
  const mappingLine = `${sequence} ${action}`;

  if (trimmedMappings.length === 0) {
    return mappingLine;
  }

  return `${trimmedMappings}\n${mappingLine}`;
};

const renameHotkeyActionIfPresent = (
  mappings: string,
  targetSequence: string,
  oldAction: string,
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

      if (targetSequence !== "*" && sequence !== targetSequence) {
        return line;
      }

      if (action !== oldAction) {
        return line;
      }

      const leadingWhitespace = content.match(/^\s*/)?.[0] ?? "";
      const trailingWhitespace = content.match(/\s*$/)?.[0] ?? "";
      return `${leadingWhitespace}${sequence} ${newAction}${trailingWhitespace}${comment}`;
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
  const originalReservedLabels = getReservedLabels(config);
  const originalHotkeyMappings = getHotkeyMappings(config);

  // if config before v1.0.6
  if (!hasDirective(originalReservedLabels, "input")) {
    migratedConfig.hints.reservedLabels = addDirectiveIfMissing(
      migratedConfig.hints.reservedLabels,
      "input",
      "kj kjf kjfd"
    );
  }

  // if config before v1.0.6
  if (!hasDirective(originalReservedLabels, "attach")) {
    migratedConfig.hints.reservedLabels = addDirectiveIfMissing(
      migratedConfig.hints.reservedLabels,
      "attach",
      "up"
    );
  }

  // if config before v1.0.8
  if (!hasDirective(originalReservedLabels, "share")) {
    migratedConfig.hints.reservedLabels = addDirectiveIfMissing(
      migratedConfig.hints.reservedLabels,
      "share",
      "sh"
    );
  }

  // if config before v1.0.9
  if (!hasDirective(originalReservedLabels, "login")) {
    migratedConfig.hints.reservedLabels = addDirectiveIfMissing(
      migratedConfig.hints.reservedLabels,
      "login",
      "si"
    );
  }

  // if config before v1.0.9
  if (!hasDirective(originalReservedLabels, "download")) {
    migratedConfig.hints.reservedLabels = addDirectiveIfMissing(
      migratedConfig.hints.reservedLabels,
      "download",
      "dl"
    );
  }

  // if config before v1.1.0
  if (!hasHotkeyMapping(originalHotkeyMappings, "yc", "yank-current-tab-url-clean")) {
    migratedConfig.hotkeys.mappings = addHotkeyMappingIfMissing(
      migratedConfig.hotkeys.mappings,
      "yc",
      "yank-current-tab-url-clean"
    );
  }

  // if config before v1.1.1
  if (!hasHotkeyMapping(originalHotkeyMappings, "yo", "duplicate-current-tab-origin")) {
    migratedConfig.hotkeys.mappings = addHotkeyMappingIfMissing(
      migratedConfig.hotkeys.mappings,
      "yo",
      "duplicate-current-tab-origin"
    );
  }

  return migratedConfig;
};