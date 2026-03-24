export type { RectLike, HintVisibilityContext } from "~/src/core/utils/hints/dom/shared";

export {
  areRectsEquivalent,
  getDomDepth,
  getMarkerRect
} from "~/src/core/utils/hints/dom/geometry";

export {
  getElementTabIndex,
  getHintTargetPreference,
  hasInteractiveRole,
  isActivatableElement,
  isIntrinsicInteractiveElement
} from "~/src/core/utils/hints/dom/interactive";

export {
  createHintVisibilityContext,
  isHintable,
  isVisibleHintTarget
} from "~/src/core/utils/hints/dom/visibility";