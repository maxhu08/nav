import {
  DOWNLOAD_ATTRIBUTE_PATTERNS,
  DOWNLOAD_SHORT_TEXT_PATTERNS,
  LOGIN_ATTRIBUTE_PATTERNS,
  LOGIN_SHORT_TEXT_PATTERNS,
  MICROPHONE_ATTRIBUTE_PATTERNS,
  MICROPHONE_SHORT_TEXT_PATTERNS,
  PREV_ATTRIBUTE_PATTERNS,
  PREV_SHORT_TEXT_PATTERNS,
  SHARE_ATTRIBUTE_PATTERNS,
  SHARE_SHORT_TEXT_PATTERNS,
  SUBMIT_ATTRIBUTE_PATTERNS,
  SUBMIT_SHORT_TEXT_PATTERNS,
  getMarkerRect,
  isSelectableElement,
  type ElementFeatureVector,
  type HintDirective
} from "~/src/core/utils/hints/directive-recognition/shared";
import {
  getActionDirectiveCandidateScore,
  getCancelCandidateScore,
  getCopyCandidateScore,
  getDislikeCandidateScore,
  getLikeCandidateScore,
  getPreferredCopyElementIndex,
  getHideCandidateScore,
  getNextCandidateScore,
  getPreferredCancelElementIndex,
  getPreferredDislikeElementIndex,
  getPreferredDownloadElementIndex,
  getPreferredHideElementIndex,
  getPreferredLoginElementIndex,
  getPreferredLikeElementIndex,
  getPreferredMicrophoneElementIndex,
  getPreferredNextElementIndex,
  getPreferredPrevElementIndex,
  getPreferredShareElementIndex,
  getPreferredSubmitElementIndex
} from "~/src/core/utils/hints/directive-recognition/action-directives";
import {
  getHomeCandidateScore,
  getPreferredHomeElementIndex,
  getPreferredSidebarElementIndex,
  getSidebarCandidateScore,
  remapSidebarDirectiveIndex
} from "~/src/core/utils/hints/directive-recognition/home-sidebar";
import {
  getAttachCandidateScore,
  getAttachEquivalentIndexes,
  getInputCandidateScore,
  getPreferredAttachElementIndex,
  getPreferredInputElementIndex,
  getPreferredSearchElementIndex,
  getStronglyOverlappingHintIndexes,
  getSuppressedAttachRelatedHintIndexes,
  remapAttachDirectiveIndex
} from "~/src/core/utils/hints/directive-recognition/input-attach";

type DirectiveDefinition = {
  directive: HintDirective;
  threshold: number;
  getScore: (
    element: HTMLElement,
    rect: DOMRect | null,
    features: ElementFeatureVector,
    context: { attachScore: number }
  ) => number;
};

const DIRECTIVE_DEFINITIONS: DirectiveDefinition[] = [
  {
    directive: "input",
    threshold: 180,
    getScore: (element, rect, features) => getInputCandidateScore(element, rect, features)
  },
  {
    directive: "attach",
    threshold: 220,
    getScore: (element, rect, features) => getAttachCandidateScore(element, rect, features)
  },
  {
    directive: "share",
    threshold: 220,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        SHARE_ATTRIBUTE_PATTERNS,
        {
          shortTextPatterns: SHARE_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "download",
    threshold: 220,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        DOWNLOAD_ATTRIBUTE_PATTERNS,
        {
          shortTextPatterns: DOWNLOAD_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "login",
    threshold: 220,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        LOGIN_ATTRIBUTE_PATTERNS,
        {
          shortTextPatterns: LOGIN_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "microphone",
    threshold: 220,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        MICROPHONE_ATTRIBUTE_PATTERNS,
        {
          requireButtonLikeControl: true,
          shortTextPatterns: MICROPHONE_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "copy",
    threshold: 220,
    getScore: (element, rect, features) => getCopyCandidateScore(element, rect, features)
  },
  {
    directive: "hide",
    threshold: 240,
    getScore: (element, rect, features) => getHideCandidateScore(element, rect, features)
  },
  {
    directive: "home",
    threshold: 180,
    getScore: (element, rect, features) => getHomeCandidateScore(element, rect, features)
  },
  {
    directive: "sidebar",
    threshold: 220,
    getScore: (element, rect, features) => getSidebarCandidateScore(element, rect, features)
  },
  {
    directive: "next",
    threshold: 200,
    getScore: (element, rect, features, context) =>
      context.attachScore === Number.NEGATIVE_INFINITY
        ? getNextCandidateScore(element, rect, features)
        : Number.NEGATIVE_INFINITY
  },
  {
    directive: "prev",
    threshold: 200,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        PREV_ATTRIBUTE_PATTERNS,
        {
          relValues: ["prev"],
          shortTextPatterns: PREV_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "cancel",
    threshold: 220,
    getScore: (element, rect, features) => getCancelCandidateScore(element, rect, features)
  },
  {
    directive: "submit",
    threshold: 220,
    getScore: (element, rect, features) =>
      getActionDirectiveCandidateScore(
        element,
        SUBMIT_ATTRIBUTE_PATTERNS,
        {
          allowFormSignals: true,
          shortTextPatterns: SUBMIT_SHORT_TEXT_PATTERNS
        },
        rect,
        features
      )
  },
  {
    directive: "like",
    threshold: 220,
    getScore: (element, rect, features) => getLikeCandidateScore(element, rect, features)
  },
  {
    directive: "dislike",
    threshold: 220,
    getScore: (element, rect, features) => getDislikeCandidateScore(element, rect, features)
  }
];

const getDefaultDirectiveThresholds = (): Record<HintDirective, number> => ({
  input: 180,
  attach: 220,
  share: 220,
  download: 220,
  login: 220,
  microphone: 220,
  copy: 220,
  hide: 240,
  home: 180,
  sidebar: 220,
  next: 200,
  prev: 200,
  cancel: 220,
  submit: 220,
  like: 220,
  dislike: 220
});

export const getPreferredDirectiveIndexes = (
  elements: HTMLElement[]
): Partial<Record<HintDirective, number>> => {
  const featureCache = new WeakMap<HTMLElement, ElementFeatureVector>();
  const bestIndexes: Partial<Record<HintDirective, number>> = {};
  const bestScores = getDefaultDirectiveThresholds();
  let selectableCount = 0;
  let onlySelectableIndex: number | null = null;

  const getFeatures = (element: HTMLElement): ElementFeatureVector => {
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

  const updateBest = (directive: HintDirective, score: number, index: number): void => {
    if (score > bestScores[directive]) {
      bestScores[directive] = score;
      bestIndexes[directive] = index;
    }
  };

  elements.forEach((element, index) => {
    const features = getFeatures(element);

    if (features.isSelectable) {
      selectableCount += 1;
      onlySelectableIndex = index;
    }

    const attachScore = getAttachCandidateScore(element, features.rect, features);
    const context = { attachScore };

    for (const definition of DIRECTIVE_DEFINITIONS) {
      const score = definition.getScore(element, features.rect, features, context);
      updateBest(definition.directive, score, index);
    }
  });

  if (selectableCount === 1) {
    bestIndexes.input = onlySelectableIndex!;
  }

  if (bestIndexes.attach !== undefined) {
    bestIndexes.attach = remapAttachDirectiveIndex(
      elements,
      bestIndexes.attach,
      (element) => getFeatures(element).rect
    );
  }

  if (bestIndexes.sidebar !== undefined) {
    bestIndexes.sidebar = remapSidebarDirectiveIndex(
      elements,
      bestIndexes.sidebar,
      (element) => getFeatures(element).rect
    );
  }

  return bestIndexes;
};

export {
  getAttachCandidateScore,
  getAttachEquivalentIndexes,
  getPreferredAttachElementIndex,
  getPreferredCancelElementIndex,
  getPreferredCopyElementIndex,
  getPreferredDislikeElementIndex,
  getPreferredDownloadElementIndex,
  getPreferredHideElementIndex,
  getPreferredHomeElementIndex,
  getPreferredInputElementIndex,
  getPreferredLoginElementIndex,
  getPreferredLikeElementIndex,
  getPreferredMicrophoneElementIndex,
  getPreferredNextElementIndex,
  getPreferredPrevElementIndex,
  getPreferredSearchElementIndex,
  getPreferredShareElementIndex,
  getPreferredSidebarElementIndex,
  getPreferredSubmitElementIndex,
  getStronglyOverlappingHintIndexes,
  getSuppressedAttachRelatedHintIndexes
};