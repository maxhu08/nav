import { DEFAULT_HINT_CHARSET } from "~/src/core/utils/hint-mode/shared/constants";

export const normalizeHintCharset = (value: string): string => {
  const uniqueCharacters = Array.from(new Set(Array.from(value.toLowerCase()).filter(Boolean)));
  return uniqueCharacters.length > 1 ? uniqueCharacters.join("") : DEFAULT_HINT_CHARSET;
};