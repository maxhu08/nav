export type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/model";
export { getMarkerRect } from "~/src/core/utils/hints/dom";
export {
  getAttachEquivalentIndexes,
  getPreferredAttachElementIndex,
  getPreferredCancelElementIndex,
  getPreferredDirectiveIndexes,
  getPreferredDislikeElementIndex,
  getPreferredDownloadElementIndex,
  getPreferredHomeElementIndex,
  getPreferredInputElementIndex,
  getPreferredLikeElementIndex,
  getPreferredNextElementIndex,
  getPreferredPrevElementIndex,
  getPreferredSearchElementIndex,
  getPreferredSidebarElementIndex,
  getPreferredSubmitElementIndex,
  getStronglyOverlappingHintIndexes,
  getSuppressedAttachRelatedHintIndexes
} from "~/src/core/utils/hints/directive-recognition";
export {
  HINT_SELECTORS_DEFAULT,
  getHintableElements
} from "~/src/core/utils/hints/hint-recognition/collection";
export {
  restoreRevealedHintControls,
  revealElementForHintCollection,
  revealHoverHintControls
} from "~/src/core/utils/hints/hint-recognition/reveal";