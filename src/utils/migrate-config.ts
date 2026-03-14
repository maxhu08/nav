import { deepMerge } from "~/src/utils/deep-merge";
import type { Config } from "~/src/utils/config";
import {
  hasForceNormalModeOption,
  hasReservedLabelsOption,
  hasV106ReservedHintDirectives,
  hasV108ShareReservedHintDirective
} from "~/src/utils/migrate/config-helpers";

const appendMissingShareDirective = (reservedLabels: string): string => {
  const trimmedReservedLabels = reservedLabels.trim();

  if (trimmedReservedLabels.length === 0) {
    return "@share sh";
  }

  return `${trimmedReservedLabels}\n@share sh`;
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

  // if config before v1.0.6
  if (!hasV106ReservedHintDirectives(config)) {
    migratedConfig.hints.reservedLabels = fallbackConfig.hints.reservedLabels;
  }

  // if config before v1.0.8
  if (!hasV108ShareReservedHintDirective(config)) {
    migratedConfig.hints.reservedLabels = appendMissingShareDirective(
      migratedConfig.hints.reservedLabels
    );
  }

  return migratedConfig;
};