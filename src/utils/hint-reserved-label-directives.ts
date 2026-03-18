export const RESERVED_HINT_DIRECTIVES = [
  "input",
  "attach",
  "share",
  "download",
  "login",
  "home",
  "sidebar",
  "next",
  "prev",
  "cancel",
  "submit",
  "like",
  "dislike"
] as const;

export type ReservedHintDirective = (typeof RESERVED_HINT_DIRECTIVES)[number];
export type ReservedHintLabels = Record<ReservedHintDirective, string[]>;

export const RESERVED_HINT_DIRECTIVE_LINE_PATTERN = /^@([a-z]+) ([a-z]+(?: [a-z]+)*)$/i;

const RESERVED_HINT_DIRECTIVE_SET = new Set<string>(RESERVED_HINT_DIRECTIVES);
const RESERVED_HINT_DIRECTIVE_ALIASES: Record<string, ReservedHintDirective> = {
  upload: "attach"
};
const NON_WHITESPACE_PATTERN = /\S+/g;

const isAsciiLowercaseWord = (value: string): boolean => {
  if (value.length === 0) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 97 || code > 122) {
      return false;
    }
  }

  return true;
};

export const isReservedHintDirective = (value: string): value is ReservedHintDirective => {
  return RESERVED_HINT_DIRECTIVE_SET.has(value);
};

export const normalizeReservedHintDirective = (value: string): ReservedHintDirective | null => {
  const normalized = value.toLowerCase();

  if (isReservedHintDirective(normalized)) {
    return normalized;
  }

  return RESERVED_HINT_DIRECTIVE_ALIASES[normalized] ?? null;
};

export const parsePreferredLabelsValue = (value: string): string[] => {
  const normalizedLabels: string[] = [];
  const seenLabels = new Set<string>();
  let previousLabelLength: number | null = null;

  for (const match of value.matchAll(NON_WHITESPACE_PATTERN)) {
    const segment = (match[0] ?? "").toLowerCase();
    const hasExpectedLength =
      previousLabelLength === null || segment.length === previousLabelLength + 1;

    if (!isAsciiLowercaseWord(segment) || seenLabels.has(segment) || !hasExpectedLength) {
      continue;
    }

    seenLabels.add(segment);
    normalizedLabels.push(segment);
    previousLabelLength = segment.length;
  }

  return normalizedLabels;
};

export const createEmptyReservedHintLabels = (): ReservedHintLabels => {
  const reservedHintLabels = {} as ReservedHintLabels;

  for (const directive of RESERVED_HINT_DIRECTIVES) {
    reservedHintLabels[directive] = [];
  }

  return reservedHintLabels;
};

export const normalizeReservedHintLabels = (
  value: Partial<Record<ReservedHintDirective, string[]>>,
  fallback: Partial<Record<ReservedHintDirective, string[]>> = {}
): ReservedHintLabels => {
  const reservedHintLabels = createEmptyReservedHintLabels();

  for (const directive of RESERVED_HINT_DIRECTIVES) {
    reservedHintLabels[directive] =
      value[directive] !== undefined
        ? [...(value[directive] ?? [])]
        : [...(fallback[directive] ?? [])];
  }

  return reservedHintLabels;
};

export const isReservedHintLabelsShapeValid = (value: unknown): value is ReservedHintLabels => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  for (const directive of RESERVED_HINT_DIRECTIVES) {
    if (!Array.isArray(record[directive])) {
      return false;
    }
  }

  return true;
};

export const parseReservedHintDirectives = (
  value: string
): Partial<Record<ReservedHintDirective, string[]>> => {
  const result: Partial<Record<ReservedHintDirective, string[]>> = {};

  for (const line of value.split("\n")) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    if (line !== trimmedLine) {
      continue;
    }

    if (line.charCodeAt(0) !== 64) {
      continue;
    }

    const match = line.match(RESERVED_HINT_DIRECTIVE_LINE_PATTERN);
    if (!match) {
      continue;
    }

    const directive = normalizeReservedHintDirective((match[1] ?? "").toLowerCase());
    if (!directive) {
      continue;
    }

    const labelsText = match[2] ?? "";
    const parsedLabels = parsePreferredLabelsValue(labelsText);
    if (parsedLabels.length === 0) {
      continue;
    }

    result[directive] = parsedLabels;
  }

  return result;
};