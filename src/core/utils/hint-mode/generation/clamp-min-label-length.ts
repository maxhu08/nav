export const clampMinLabelLength = (value: number): number => {
  return Math.max(1, Math.floor(value));
};