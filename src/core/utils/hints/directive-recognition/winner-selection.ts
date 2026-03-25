import type {
  DirectiveThresholdMap,
  GeneratedDirectiveCandidates,
  PreferredDirectiveIndexes
} from "~/src/core/utils/hints/directive-recognition/types";
import type { DirectiveDefinition } from "~/src/core/utils/hints/directive-recognition/types";

export const selectWinningDirectiveIndexes = (
  candidates: GeneratedDirectiveCandidates,
  definitions: readonly DirectiveDefinition[],
  thresholds: DirectiveThresholdMap
): PreferredDirectiveIndexes => {
  const bestIndexes: PreferredDirectiveIndexes = {};
  const bestScores = { ...thresholds };

  candidates.perElementScores.forEach((scores, index) => {
    for (const definition of definitions) {
      const score = scores[definition.directive] ?? Number.NEGATIVE_INFINITY;
      if (score > bestScores[definition.directive]) {
        bestScores[definition.directive] = score;
        bestIndexes[definition.directive] = index;
      }
    }
  });

  if (candidates.selectableCount === 1 && candidates.onlySelectableIndex !== null) {
    bestIndexes.input = candidates.onlySelectableIndex;
  }

  return bestIndexes;
};