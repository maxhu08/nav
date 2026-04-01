import { deepMerge } from "~/src/utils/deep-merge";
import type { Config } from "~/src/utils/config";
import {
  hasDirectivesOption,
  hasForceNormalModeOption,
  hasLegacyReservedLabelsOption
} from "~/src/utils/migrate/config-helpers";

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

export const migrateOldConfig = (config: unknown, fallbackConfig: Config): Config => {
  // if config before v1.0.3
  if (!hasDirectivesOption(config) && !hasLegacyReservedLabelsOption(config)) {
    return structuredClone(fallbackConfig);
  }

  // if config before v1.1.4
  if (!hasDirectivesOption(config)) {
    const migratedConfig = deepMerge(structuredClone(fallbackConfig), config);
    migratedConfig.hints.directives = fallbackConfig.hints.directives;
    return migratedConfig;
  }

  // if config before v1.0.4
  if (!hasForceNormalModeOption(config)) {
    return deepMerge(structuredClone(fallbackConfig), config);
  }

  const migratedConfig = deepMerge(structuredClone(fallbackConfig), config);

  // if config before v1.1.1
  migratedConfig.hotkeys.mappings = renameHotkeyMappingIfPresent(
    migratedConfig.hotkeys.mappings,
    "yb",
    "duplicate-current-tab-base",
    "yo",
    "duplicate-current-tab-origin"
  );

  return migratedConfig;
};