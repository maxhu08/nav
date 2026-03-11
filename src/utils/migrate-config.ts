import { deepMerge } from "~/src/utils/deep-merge";
import type { Config } from "~/src/utils/config";

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasReservedLabelsOption = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const hints = value.hints;
  if (!isObjectRecord(hints)) {
    return false;
  }

  return "reservedLabels" in hints;
};

export const migrateOldConfig = (config: unknown, fallbackConfig: Config): Config => {
  // if config before v1.0.3
  if (!hasReservedLabelsOption(config)) {
    return structuredClone(fallbackConfig);
  }

  return deepMerge(structuredClone(fallbackConfig), config);
};
