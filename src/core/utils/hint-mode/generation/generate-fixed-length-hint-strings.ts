export const generateFixedLengthHintStrings = (
  count: number,
  charset: string,
  width: number
): string[] => {
  const labels: string[] = [];

  const visit = (prefix: string): void => {
    if (labels.length >= count) {
      return;
    }

    if (prefix.length === width) {
      labels.push(prefix);
      return;
    }

    for (const character of charset) {
      visit(`${prefix}${character}`);
      if (labels.length >= count) {
        return;
      }
    }
  };

  visit("");
  return labels;
};