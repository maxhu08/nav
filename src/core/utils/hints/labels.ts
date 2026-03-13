import type { AdjacentHintPairs, HintLabelPlanSettings } from "~/src/core/utils/hints/types";

const labelPlanCache = new Map<string, { labelLength: number; labels: string[] }>();

export const clearHintLabelPlanCache = (): void => {
  labelPlanCache.clear();
};

const serializeBlockedPairs = (blockedPairs: AdjacentHintPairs): string => {
  const entries: string[] = [];

  for (const left of Object.keys(blockedPairs).sort()) {
    const rights = Object.keys(blockedPairs[left] ?? {})
      .filter((right) => blockedPairs[left]?.[right] === true)
      .sort();

    if (rights.length > 0) {
      entries.push(`${left}>${rights.join(",")}`);
    }
  }

  return entries.join("|");
};

const getLabelPlanCacheKey = (
  count: number,
  reservedLabels: string[],
  blockedPairs: AdjacentHintPairs,
  settings: HintLabelPlanSettings
): string => {
  return [
    count,
    reservedLabels.join(","),
    settings.minHintLabelLength,
    settings.hintAlphabet,
    Array.from(settings.reservedHintPrefixes).sort().join(","),
    serializeBlockedPairs(blockedPairs)
  ].join("::");
};

export const doesLabelConflictWithReservedLabels = (
  label: string,
  reservedLabels: string[]
): boolean =>
  reservedLabels.some(
    (reservedLabel) => label.startsWith(reservedLabel) || reservedLabel.startsWith(label)
  );

const buildLabelsForBlockedPairs = (
  count: number,
  reservedLabels: string[],
  blockedPairs: AdjacentHintPairs,
  settings: HintLabelPlanSettings
): { labelLength: number; labels: string[] } => {
  const cacheKey = getLabelPlanCacheKey(count, reservedLabels, blockedPairs, settings);
  const cachedPlan = labelPlanCache.get(cacheKey);

  if (cachedPlan) {
    return {
      labelLength: cachedPlan.labelLength,
      labels: [...cachedPlan.labels]
    };
  }

  const alphabet = settings.hintAlphabet.split("");
  const firstCharacters = alphabet.filter((char) => !settings.reservedHintPrefixes.has(char));
  const leadingAlphabet = firstCharacters.length > 0 ? firstCharacters : alphabet;
  const allowedByPreviousChar = new Map<string, string[]>();

  for (const previousChar of alphabet) {
    const blockedTransitions = blockedPairs[previousChar];

    if (!blockedTransitions) {
      allowedByPreviousChar.set(previousChar, alphabet);
      continue;
    }

    allowedByPreviousChar.set(
      previousChar,
      alphabet.filter((char) => blockedTransitions[char] !== true)
    );
  }

  const subtreeCapacityCache = new Map<string, number>();
  const labels: string[] = [];

  const getAllowedChars = (previousChar: string | null, isLeadingCharacter: boolean): string[] => {
    if (isLeadingCharacter) {
      return leadingAlphabet;
    }

    if (previousChar === null) {
      return alphabet;
    }

    return allowedByPreviousChar.get(previousChar) ?? alphabet;
  };

  const getSubtreeCapacity = (
    previousChar: string | null,
    remainingLength: number,
    isLeadingCharacter: boolean
  ): number => {
    if (remainingLength <= 0) return 1;

    const cacheKey = `${previousChar ?? "_"}:${remainingLength}:${isLeadingCharacter ? "1" : "0"}`;
    const cachedCapacity = subtreeCapacityCache.get(cacheKey);
    if (cachedCapacity !== undefined) {
      return cachedCapacity;
    }

    let subtreeCapacity = 0;

    for (const char of getAllowedChars(previousChar, isLeadingCharacter)) {
      subtreeCapacity += getSubtreeCapacity(char, remainingLength - 1, false);
    }

    subtreeCapacityCache.set(cacheKey, subtreeCapacity);
    return subtreeCapacity;
  };

  const distributeLabels = (
    prefix: string,
    previousChar: string | null,
    remainingCount: number,
    remainingLength: number,
    isLeadingCharacter: boolean
  ): void => {
    if (remainingCount <= 0) return;

    const sourceAlphabet = getAllowedChars(previousChar, isLeadingCharacter);
    let assignedCount = 0;

    for (let index = 0; index < sourceAlphabet.length; index += 1) {
      const char = sourceAlphabet[index]!;
      const nextLabel = `${prefix}${char}`;
      const remainingBuckets = sourceAlphabet.length - index;
      const nextRemainingCount = remainingCount - assignedCount;
      const subtreeCapacity = getSubtreeCapacity(char, remainingLength - 1, false);
      const bucketCount = Math.min(
        subtreeCapacity,
        Math.ceil(nextRemainingCount / remainingBuckets)
      );

      if (bucketCount <= 0) continue;

      if (remainingLength === 1 && doesLabelConflictWithReservedLabels(nextLabel, reservedLabels)) {
        continue;
      }

      if (remainingLength === 1) {
        labels.push(nextLabel);
      } else {
        distributeLabels(nextLabel, char, bucketCount, remainingLength - 1, false);
      }

      assignedCount += bucketCount;
      if (assignedCount >= remainingCount || labels.length >= count) return;
    }
  };

  let labelLength = settings.minHintLabelLength;
  let capacity = getSubtreeCapacity(null, labelLength, true);
  while (capacity < count) {
    const nextLength = labelLength + 1;
    const nextCapacity = getSubtreeCapacity(null, nextLength, true);

    if (nextCapacity <= capacity) {
      const result = { labelLength, labels: [] };
      labelPlanCache.set(cacheKey, result);
      return result;
    }

    labelLength = nextLength;
    capacity = nextCapacity;
  }

  distributeLabels("", null, count, labelLength, true);

  if (labels.length > count) {
    labels.length = count;
  }

  const result = {
    labelLength,
    labels: labels.slice(0, count - reservedLabels.length)
  };

  labelPlanCache.set(cacheKey, result);
  return result;
};

export const buildHintLabels = (
  count: number,
  reservedLabels: string[],
  settings: HintLabelPlanSettings
): { labelLength: number; labels: string[] } => {
  if (count <= 0) {
    return { labelLength: 0, labels: [] };
  }

  const labels = buildLabelsForBlockedPairs(
    count,
    reservedLabels,
    settings.avoidedAdjacentHintPairs,
    settings
  );

  if (labels.labels.length === count - reservedLabels.length) {
    return labels;
  }

  return buildLabelsForBlockedPairs(count, reservedLabels, {}, settings);
};