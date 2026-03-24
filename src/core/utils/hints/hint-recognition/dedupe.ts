import { getAttachCandidateScore } from "~/src/core/utils/hints/directive-recognition";
import { dedupeEquivalentAttachTargets } from "~/src/core/utils/hints/hint-recognition/attach";
import {
  hasEquivalentAncestorTarget,
  hasEquivalentDescendantTarget
} from "~/src/core/utils/hints/hint-recognition/ancestor";
import { createHintCollectionContext } from "~/src/core/utils/hints/hint-recognition/context";
import { dedupeEquivalentHintTargets } from "~/src/core/utils/hints/hint-recognition/equivalent";
import { dedupeEquivalentLabelTargets } from "~/src/core/utils/hints/hint-recognition/labels";
import { dedupeEquivalentSemanticTargets } from "~/src/core/utils/hints/hint-recognition/semantic";
import type { HintCollectionContext } from "~/src/core/utils/hints/hint-recognition/shared";

export type { HintCollectionContext } from "~/src/core/utils/hints/hint-recognition/shared";
export { createHintCollectionContext } from "~/src/core/utils/hints/hint-recognition/context";

export const dedupeCollectedHintTargets = (
  elements: HTMLElement[],
  context: HintCollectionContext
): HTMLElement[] => {
  const candidateSet = new Set(elements);
  const withoutEquivalentAncestors = elements.filter(
    (element) => !hasEquivalentAncestorTarget(element, candidateSet, context.getRect)
  );
  const withoutEquivalentNestedWrappers = withoutEquivalentAncestors.filter(
    (element) =>
      !hasEquivalentDescendantTarget(element, candidateSet, context.getRect, context.getPreference)
  );

  return dedupeEquivalentAttachTargets(
    dedupeEquivalentSemanticTargets(
      dedupeEquivalentLabelTargets(
        dedupeEquivalentHintTargets(
          withoutEquivalentNestedWrappers,
          context.getRect,
          context.getIdentity,
          context.getPreference
        ),
        context.getPreference
      ),
      context.getRect,
      context.getPreference,
      getAttachCandidateScore
    ),
    context.getRect,
    context.getPreference
  );
};