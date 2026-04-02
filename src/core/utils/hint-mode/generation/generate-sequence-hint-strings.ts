import { reverseString } from "~/src/core/utils/hint-mode/generation/reverse-string";

export const generateSequenceHintStrings = (count: number, charset: string): string[] => {
  if (count <= 0) {
    return [];
  }

  let hints = [""];
  let offset = 0;

  while (hints.length - offset < count || hints.length === 1) {
    const hint = hints[offset] ?? "";
    offset += 1;

    for (const character of charset) {
      hints.push(character + hint);
    }
  }

  return hints
    .slice(offset, offset + count)
    .sort((left, right) => left.localeCompare(right))
    .map((value) => reverseString(value));
};