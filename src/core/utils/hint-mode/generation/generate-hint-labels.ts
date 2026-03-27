import { generateFixedLengthHintStrings } from "~/src/core/utils/hint-mode/generation/generate-fixed-length-hint-strings";
import { generateSequenceHintStrings } from "~/src/core/utils/hint-mode/generation/generate-sequence-hint-strings";

const generateRestrictedLeadingLabels = (
  count: number,
  charset: string,
  minLength: number,
  forbiddenLeadingCharacters: Set<string>
): string[] => {
  const allowedLeadingCharacters = Array.from(charset).filter(
    (character) => !forbiddenLeadingCharacters.has(character)
  );

  if (allowedLeadingCharacters.length === 0) {
    return minLength <= 1
      ? generateSequenceHintStrings(count, charset)
      : generateFixedLengthHintStrings(count, charset, minLength);
  }

  const labels: string[] = [];
  let width = Math.max(1, minLength);

  const appendWidth = (currentWidth: number): void => {
    const visit = (prefix: string, depth: number): void => {
      if (labels.length >= count) {
        return;
      }

      if (depth === currentWidth) {
        labels.push(prefix);
        return;
      }

      const characters = depth === 0 ? allowedLeadingCharacters : Array.from(charset);
      for (const character of characters) {
        visit(`${prefix}${character}`, depth + 1);
        if (labels.length >= count) {
          return;
        }
      }
    };

    visit("", 0);
  };

  while (labels.length < count) {
    appendWidth(width);
    width += 1;
  }

  return labels;
};

export const generateHintLabels = (
  count: number,
  charset: string,
  minLength = 1,
  forbiddenLeadingCharacters: string[] = []
): string[] => {
  const forbiddenLeadingCharacterSet = new Set(
    forbiddenLeadingCharacters.map((character) => character.toLowerCase())
  );

  if (forbiddenLeadingCharacterSet.size > 0) {
    return generateRestrictedLeadingLabels(count, charset, minLength, forbiddenLeadingCharacterSet);
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