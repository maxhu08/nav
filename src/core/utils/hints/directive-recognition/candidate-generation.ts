import {
  getMarkerRect,
  isSelectableElement
} from "~/src/core/utils/hints/directive-recognition/shared";
import type { DirectiveDefinition } from "~/src/core/utils/hints/directive-recognition/types";
import type {
  ElementFeatureVector,
  GeneratedDirectiveCandidates
} from "~/src/core/utils/hints/directive-recognition/types";
import { getAttachCandidateScore } from "~/src/core/utils/hints/directive-recognition/input-attach";
import type { DirectiveCandidateScoreMap } from "~/src/core/utils/hints/directive-recognition/types";

export type DirectiveFeatureResolver = (element: HTMLElement) => ElementFeatureVector;

export const createDirectiveFeatureResolver = (): DirectiveFeatureResolver => {
  const featureCache = new WeakMap<HTMLElement, ElementFeatureVector>();

  return (element) => {
    const cached = featureCache.get(element);
    if (cached) {
      return cached;
    }

    const features: ElementFeatureVector = {
      rect: getMarkerRect(element),
      isSelectable: isSelectableElement(element),
      joinedAttributeTextCache: new Map(),
      closestCache: new Map()
    };

    featureCache.set(element, features);
    return features;
  };
};

export const generateDirectiveCandidates = (
  elements: HTMLElement[],
  definitions: readonly DirectiveDefinition[],
  getFeatures: DirectiveFeatureResolver
): GeneratedDirectiveCandidates => {
  const perElementScores: DirectiveCandidateScoreMap[] = elements.map(() => ({}));
  let selectableCount = 0;
  let onlySelectableIndex: number | null = null;

  elements.forEach((element, index) => {
    const features = getFeatures(element);
    if (features.isSelectable) {
      selectableCount += 1;
      onlySelectableIndex = index;
    }

    const context = {
      attachScore: getAttachCandidateScore(element, features.rect, features)
    };

    for (const definition of definitions) {
      perElementScores[index][definition.directive] = definition.getScore(
        element,
        features.rect,
        features,
        context
      );
    }
  });

  return {
    perElementScores,
    selectableCount,
    onlySelectableIndex
  };
};