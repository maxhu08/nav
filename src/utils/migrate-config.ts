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

  return migratedConfig;
};