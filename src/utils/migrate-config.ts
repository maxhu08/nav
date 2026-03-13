import { deepMerge } from "~/src/utils/deep-merge";
import type { Config } from "~/src/utils/config";
import {
  hasForceNormalModeOption,
  hasReservedLabelsOption,
  hasV106ReservedHintDirectives
} from "~/src/utils/migrate/config-helpers";

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

  return migratedConfig;
};