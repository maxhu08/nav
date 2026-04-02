import { deepMerge } from "~/src/utils/deep-merge";
import type { Config } from "~/src/utils/config";
import { HOTKEY_UNBOUND_SEQUENCE, isActionName, VALID_ACTION_NAMES } from "~/src/utils/hotkeys";
import {
  normalizeReservedHintDirective,
  RESERVED_HINT_DIRECTIVES,
  RESERVED_HINT_DIRECTIVE_LINE_PATTERN,
  RESERVED_HINT_UNBOUND_LABEL
} from "~/src/utils/hint-reserved-label-directives";
import {
  hasDirectivesOption,
  hasForceNormalModeOption,
  hasLegacyReservedLabelsOption
} from "~/src/utils/migrate/config-helpers";

const appendMissingHotkeyDeclarations = (mappings: string): string => {
  const declaredActions = new Set<string>();

  for (const line of mappings.split("\n")) {
    const commentStartIndex = line.indexOf("#");
    const lineWithoutComment = commentStartIndex === -1 ? line : line.slice(0, commentStartIndex);
    const trimmedLine = lineWithoutComment.trim();

    if (!trimmedLine) {
      continue;
    }

    const separatorIndex = trimmedLine.search(/\s/);
    if (separatorIndex === -1) {
      continue;
    }

    const actionCandidate = trimmedLine.slice(separatorIndex).trim();
    if (isActionName(actionCandidate)) {
      declaredActions.add(actionCandidate);
    }
  }

  const missingDeclarations = Array.from(VALID_ACTION_NAMES)
    .filter((actionName) => !declaredActions.has(actionName))
    .map((actionName) => `${HOTKEY_UNBOUND_SEQUENCE} ${actionName}`);

  if (missingDeclarations.length === 0) {
    return mappings;
  }

  return [mappings.trimEnd(), ...missingDeclarations].filter(Boolean).join("\n");
};

const appendMissingHintDirectives = (directives: string): string => {
  const declaredDirectives = new Set<string>();

  for (const rawLine of directives.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(RESERVED_HINT_DIRECTIVE_LINE_PATTERN);
    if (!match) {
      continue;
    }

    const directive = normalizeReservedHintDirective(match[1] ?? "");
    if (directive) {
      declaredDirectives.add(directive);
    }
  }

  const missingDirectives = RESERVED_HINT_DIRECTIVES.filter(
    (directive) => !declaredDirectives.has(directive)
  ).map((directive) => `@${directive} ${RESERVED_HINT_UNBOUND_LABEL}`);

  if (missingDirectives.length === 0) {
    return directives;
  }

  return [directives.trimEnd(), ...missingDirectives].filter(Boolean).join("\n");
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

export const migrateOldConfig = (config: unknown, fallbackConfig: Config): Config => {
  // if config before v1.0.3
  if (!hasDirectivesOption(config) && !hasLegacyReservedLabelsOption(config)) {
    return structuredClone(fallbackConfig);
  }

  // if config before v1.0.4
  if (!hasForceNormalModeOption(config)) {
    const migratedConfig = deepMerge(structuredClone(fallbackConfig), config);
    migratedConfig.hotkeys.mappings = appendMissingHotkeyDeclarations(
      migratedConfig.hotkeys.mappings
    );
    migratedConfig.hints.directives = appendMissingHintDirectives(migratedConfig.hints.directives);
    return migratedConfig;
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
  migratedConfig.hotkeys.mappings = appendMissingHotkeyDeclarations(
    migratedConfig.hotkeys.mappings
  );

  // if config before v1.1.4
  if (!hasDirectivesOption(config)) {
    const migratedConfig = deepMerge(structuredClone(fallbackConfig), config);
    migratedConfig.hints.directives = fallbackConfig.hints.directives;
    migratedConfig.hints.styling = fallbackConfig.hints.styling;

    if ((migratedConfig.hints as any).reservedLabels) {
      delete (migratedConfig.hints as any).reservedLabels;
    }

    migratedConfig.hotkeys.mappings = appendMissingHotkeyDeclarations(
      migratedConfig.hotkeys.mappings
    );
    migratedConfig.hints.directives = appendMissingHintDirectives(migratedConfig.hints.directives);

    return migratedConfig;
  }

  migratedConfig.hints.directives = appendMissingHintDirectives(migratedConfig.hints.directives);

  return migratedConfig;
};