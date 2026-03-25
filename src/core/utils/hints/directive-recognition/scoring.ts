export type ScoreAccumulator = {
  add: (points: number) => void;
  addStrong: (points: number) => void;
  addIf: (condition: boolean, points: number) => void;
  addMatch: (
    text: string,
    patterns: readonly RegExp[],
    points: number,
    strong?: boolean
  ) => boolean;
  finish: (options?: { requireStrongSignal?: boolean }) => number;
};

export const addCappedWidthBonus = (
  score: ScoreAccumulator,
  rect: DOMRect,
  cap: number,
  divisor: number
): void => {
  score.add(Math.min(cap, rect.width) / divisor);
};

export const addCappedHeightBonus = (
  score: ScoreAccumulator,
  rect: DOMRect,
  cap: number,
  divisor: number
): void => {
  score.add(Math.min(cap, rect.height) / divisor);
};

export const addAreaPenalty = (
  score: ScoreAccumulator,
  rect: DOMRect,
  cap: number,
  divisor: number
): void => {
  score.add(-Math.min(cap, rect.width * rect.height) / divisor);
};

export const createScoreAccumulator = (baseScore = 0): ScoreAccumulator => {
  let total = baseScore;
  let hasStrongSignal = false;

  return {
    add: (points) => {
      total += points;
    },
    addStrong: (points) => {
      total += points;
      hasStrongSignal = true;
    },
    addIf: (condition, points) => {
      if (condition) {
        total += points;
      }
    },
    addMatch: (text, patterns, points, strong = false) => {
      const didMatch = patterns.some((pattern) => pattern.test(text));
      if (!didMatch) {
        return false;
      }

      total += points;
      if (strong) {
        hasStrongSignal = true;
      }

      return true;
    },
    finish: ({ requireStrongSignal = false } = {}) => {
      if (requireStrongSignal && !hasStrongSignal) {
        return Number.NEGATIVE_INFINITY;
      }

      return total;
    }
  };
};