import {
  getPreferredCopyElementIndex,
  getPreferredChatElementIndex,
  getPreferredEraseElementIndex,
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
  getPreferredHomeElementIndex,
  getPreferredSidebarElementIndex
} from "~/src/core/utils/hints/directive-recognition/home-sidebar";
import {
  getAttachCandidateScore,
  getAttachEquivalentIndexes,
  getCombinedInputCandidateScore,
  getPreferredAttachElementIndex,
  getPreferredInputElementIndex,
  getPreferredSearchElementIndex,
  getStronglyOverlappingHintIndexes,
  getSuppressedAttachRelatedHintIndexes
} from "~/src/core/utils/hints/directive-recognition/input-attach";
import {
  createDirectiveFeatureResolver,
  generateDirectiveCandidates
} from "~/src/core/utils/hints/directive-recognition/candidate-generation";
import {
  DIRECTIVE_DEFINITIONS,
  getDefaultDirectiveThresholds
} from "~/src/core/utils/hints/directive-recognition/definitions";
import { remapPreferredDirectiveIndexes } from "~/src/core/utils/hints/directive-recognition/post-selection";
import type { PreferredDirectiveIndexes } from "~/src/core/utils/hints/directive-recognition/types";
import { selectWinningDirectiveIndexes } from "~/src/core/utils/hints/directive-recognition/winner-selection";

export const getPreferredDirectiveIndexes = (
  elements: HTMLElement[]
): PreferredDirectiveIndexes => {
  const getFeatures = createDirectiveFeatureResolver();
  const candidates = generateDirectiveCandidates(elements, DIRECTIVE_DEFINITIONS, getFeatures);
  const bestIndexes = selectWinningDirectiveIndexes(
    candidates,
    DIRECTIVE_DEFINITIONS,
    getDefaultDirectiveThresholds()
  );

  return remapPreferredDirectiveIndexes(elements, bestIndexes, getFeatures);
};

export {
  getAttachCandidateScore,
  getAttachEquivalentIndexes,
  getCombinedInputCandidateScore,
  getPreferredAttachElementIndex,
  getPreferredCancelElementIndex,
  getPreferredChatElementIndex,
  getPreferredCopyElementIndex,
  getPreferredDislikeElementIndex,
  getPreferredDownloadElementIndex,
  getPreferredEraseElementIndex,
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