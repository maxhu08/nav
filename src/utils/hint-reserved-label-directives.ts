export const RESERVED_HINT_DIRECTIVES = [
  "input",
  "erase",
  "attach",
  "chat",
  "share",
  "download",
  "login",
  "microphone",
  "notification",
  "delete",
  "save",
  "copy",
  "hide",
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

export const RESERVED_HINT_UNBOUND_LABEL = "<unbound>";

export const RESERVED_HINT_DIRECTIVE_LINE_PATTERN =
  /^@([a-z-]+)\s+(<unbound>|[a-z]+(?:\s+[a-z]+)*)$/;

export const createEmptyReservedHintLabels = (): ReservedHintLabels => ({
  input: [],
  erase: [],
  attach: [],
  chat: [],
  share: [],
  download: [],
  login: [],
  microphone: [],
  notification: [],
  delete: [],
  save: [],
  copy: [],
  hide: [],
  home: [],
  sidebar: [],
  next: [],
  prev: [],
  cancel: [],
  submit: [],
  like: [],
  dislike: []
});

export const normalizeReservedHintDirective = (value: string): ReservedHintDirective | null => {
  const normalized = value.trim().toLowerCase();
  return RESERVED_HINT_DIRECTIVES.includes(normalized as ReservedHintDirective)
    ? (normalized as ReservedHintDirective)
    : null;
};

export const normalizeReservedHintLabels = (
  value: Partial<ReservedHintLabels>
): ReservedHintLabels => {
  const normalized = createEmptyReservedHintLabels();

  for (const directive of RESERVED_HINT_DIRECTIVES) {
    normalized[directive] = Array.isArray(value[directive])
      ? value[directive].filter((label): label is string => typeof label === "string")
      : [];
  }

  return normalized;
};

export const isReservedHintLabelsShapeValid = (value: unknown): value is ReservedHintLabels => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return RESERVED_HINT_DIRECTIVES.every(
    (directive) =>
      Array.isArray(record[directive]) &&
      record[directive].every((label) => typeof label === "string")
  );
};

export const parseReservedHintDirectives = (value: string): ReservedHintLabels => {
  const parsed = createEmptyReservedHintLabels();

  for (const rawLine of value.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(RESERVED_HINT_DIRECTIVE_LINE_PATTERN);
    if (!match) {
      continue;
    }

    const directive = normalizeReservedHintDirective(match[1] ?? "");
    if (!directive) {
      continue;
    }

    const labelsValue = (match[2] ?? "").trim().toLowerCase();
    parsed[directive] =
      labelsValue === RESERVED_HINT_UNBOUND_LABEL
        ? []
        : labelsValue
            .split(/\s+/)
            .map((label) => label.trim().toLowerCase())
            .filter((label) => /^[a-z]+$/.test(label));
  }

  return parsed;
};