import {
  type ActionDirectiveOptions,
  type DirectiveDefinition,
  type HintDirective
} from "~/src/core/utils/hints/directive-recognition/types";
import {
  DELETE_ATTRIBUTE_PATTERNS,
  DELETE_SHORT_TEXT_PATTERNS,
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
  SUBMIT_SHORT_TEXT_PATTERNS
} from "~/src/core/utils/hints/directive-recognition/shared";
import {
  getActionDirectiveCandidateScore,
  getCancelCandidateScore,
  getChatCandidateScore,
  getCopyCandidateScore,
  getDislikeCandidateScore,
  getEraseCandidateScore,
  getHideCandidateScore,
  getLikeCandidateScore,
  getNextCandidateScore,
  getNotificationCandidateScore,
  getSaveCandidateScore
} from "~/src/core/utils/hints/directive-recognition/action-directives";
import {
  getHomeCandidateScore,
  getSidebarCandidateScore
} from "~/src/core/utils/hints/directive-recognition/home-sidebar";
import { getCombinedInputCandidateScore } from "~/src/core/utils/hints/directive-recognition/input-attach";

const createActionDirectiveDefinition = (
  directive: HintDirective,
  patterns: readonly RegExp[],
  threshold: number,
  options: ActionDirectiveOptions = {}
): DirectiveDefinition => ({
  directive,
  threshold,
  getScore: (element, rect, features) =>
    getActionDirectiveCandidateScore(element, patterns, options, rect, features)
});

export const DIRECTIVE_DEFINITIONS: DirectiveDefinition[] = [
  {
    directive: "input",
    threshold: 180,
    getScore: (element, rect, features) => getCombinedInputCandidateScore(element, rect, features)
  },
  {
    directive: "erase",
    threshold: 180,
    getScore: (element, rect, features) =>
      features.isSelectable
        ? getCombinedInputCandidateScore(element, rect, features) - 40
        : getEraseCandidateScore(element, rect, features)
  },
  {
    directive: "attach",
    threshold: 220,
    getScore: (_element, _rect, _features, context) => context.attachScore
  },
  {
    directive: "chat",
    threshold: 220,
    getScore: (element, rect, features) => getChatCandidateScore(element, rect, features)
  },
  createActionDirectiveDefinition("share", SHARE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: SHARE_SHORT_TEXT_PATTERNS
  }),
  createActionDirectiveDefinition("download", DOWNLOAD_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: DOWNLOAD_SHORT_TEXT_PATTERNS
  }),
  createActionDirectiveDefinition("login", LOGIN_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: LOGIN_SHORT_TEXT_PATTERNS
  }),
  createActionDirectiveDefinition("microphone", MICROPHONE_ATTRIBUTE_PATTERNS, 220, {
    requireButtonLikeControl: true,
    shortTextPatterns: MICROPHONE_SHORT_TEXT_PATTERNS
  }),
  {
    directive: "notification",
    threshold: 220,
    getScore: (element, rect, features) => getNotificationCandidateScore(element, rect, features)
  },
  createActionDirectiveDefinition("delete", DELETE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: DELETE_SHORT_TEXT_PATTERNS
  }),
  {
    directive: "save",
    threshold: 220,
    getScore: (element, rect, features) => getSaveCandidateScore(element, rect, features)
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
  createActionDirectiveDefinition("prev", PREV_ATTRIBUTE_PATTERNS, 200, {
    relValues: ["prev"],
    shortTextPatterns: PREV_SHORT_TEXT_PATTERNS
  }),
  {
    directive: "cancel",
    threshold: 220,
    getScore: (element, rect, features) => getCancelCandidateScore(element, rect, features)
  },
  createActionDirectiveDefinition("submit", SUBMIT_ATTRIBUTE_PATTERNS, 220, {
    allowFormSignals: true,
    shortTextPatterns: SUBMIT_SHORT_TEXT_PATTERNS
  }),
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

export const getDefaultDirectiveThresholds = (): Record<HintDirective, number> => {
  return Object.fromEntries(
    DIRECTIVE_DEFINITIONS.map(({ directive, threshold }) => [directive, threshold])
  ) as Record<HintDirective, number>;
};