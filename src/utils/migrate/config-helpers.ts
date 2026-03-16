const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const hasReservedLabelsOption = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const hints = value.hints;
  if (!isObjectRecord(hints)) {
    return false;
  }

  return "reservedLabels" in hints;
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

export const hasV106ReservedHintDirectives = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const hints = value.hints;
  if (!isObjectRecord(hints) || typeof hints.reservedLabels !== "string") {
    return false;
  }

  return hints.reservedLabels.includes("@input ") && hints.reservedLabels.includes("@attach ");
};

export const hasV108ShareReservedHintDirective = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const hints = value.hints;
  if (!isObjectRecord(hints) || typeof hints.reservedLabels !== "string") {
    return false;
  }

  return hints.reservedLabels.includes("@share ");
};

export const hasV109DownloadReservedHintDirective = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const hints = value.hints;
  if (!isObjectRecord(hints) || typeof hints.reservedLabels !== "string") {
    return false;
  }

  return hints.reservedLabels.includes("@download ");
};