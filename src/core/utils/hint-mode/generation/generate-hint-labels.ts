import { generateFixedLengthHintStrings } from "~/src/core/utils/hint-mode/generation/generate-fixed-length-hint-strings";
import { generateSequenceHintStrings } from "~/src/core/utils/hint-mode/generation/generate-sequence-hint-strings";

type ForbiddenAdjacentPairs = Partial<Record<string, Partial<Record<string, true>>>>;

const generateRestrictedLabels = (
  count: number,
  charset: string,
  minLength: number,
  forbiddenLeadingCharacters: Set<string>,
  forbiddenAdjacentPairs: ForbiddenAdjacentPairs
): string[] => {
  const labels: string[] = [];
  let prefixes = [""];
  let width = 0;

  while (labels.length < count && prefixes.length > 0) {
    const nextPrefixes: string[] = [];
    const characters =
      width === 0
        ? Array.from(charset).filter((character) => !forbiddenLeadingCharacters.has(character))
        : Array.from(charset);

    for (const prefix of prefixes) {
      const previousCharacter = prefix.at(-1) ?? null;

      for (const character of characters) {
        if (previousCharacter && forbiddenAdjacentPairs[previousCharacter]?.[character]) {
          continue;
        }

        const nextPrefix = `${prefix}${character}`;
        nextPrefixes.push(nextPrefix);

        if (width + 1 >= minLength) {
          labels.push(nextPrefix);
          if (labels.length >= count) {
            return labels;
          }
        }
      }
    }

    prefixes = nextPrefixes;
    width += 1;
  }

  return labels;
};

export const generateHintLabels = (
  count: number,
  charset: string,
  minLength = 1,
  forbiddenLeadingCharacters: string[] = [],
  forbiddenAdjacentPairs: ForbiddenAdjacentPairs = {}
): string[] => {
  const forbiddenLeadingCharacterSet = new Set(
    forbiddenLeadingCharacters.map((character) => character.toLowerCase())
  );

  const hasForbiddenAdjacentPairs = Object.keys(forbiddenAdjacentPairs).length > 0;

  if (forbiddenLeadingCharacterSet.size > 0 || hasForbiddenAdjacentPairs) {
    return generateRestrictedLabels(
      count,
      charset,
      minLength,
      forbiddenLeadingCharacterSet,
      forbiddenAdjacentPairs
    );
  }

  if (minLength <= 1) {
    return generateSequenceHintStrings(count, charset);
  }

  const width = Math.max(
    minLength,
    count <= 1 ? 1 : Math.ceil(Math.log(count) / Math.log(charset.length))
  );

  return generateFixedLengthHintStrings(count, charset, width);
};