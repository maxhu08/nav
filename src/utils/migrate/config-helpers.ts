const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getHintsRecord = (value: unknown): Record<string, unknown> | null => {
  if (!isObjectRecord(value) || !isObjectRecord(value.hints)) {
    return null;
  }

  return value.hints;
};

export const hasLegacyReservedLabelsOption = (value: unknown): boolean => {
  const hints = getHintsRecord(value);
  if (!hints) {
    return false;
  }

  return "reservedLabels" in hints;
};

export const hasDirectivesOption = (value: unknown): boolean => {
  const hints = getHintsRecord(value);
  if (!hints) {
    return false;
  }

  return "directives" in hints;
};

export const hasLegacyShowActivationIndicatorOption = (value: unknown): boolean => {
  const hints = getHintsRecord(value);
  if (!hints) {
    return false;
  }

  return "showActivationIndicator" in hints || "showActivationIndicatorColor" in hints;
};

export const hasForceNormalModeOption = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const rules = value.rules;
  if (!isObjectRecord(rules)) {
    return false;
  }

  return "forceNormalMode" in rules;
};