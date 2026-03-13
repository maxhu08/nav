import { setMarkerTypedState } from "~/src/core/utils/hints/markers";
import type { HintLabelIndex, HintMarker, MarkerDomAttributes } from "~/src/core/utils/hints/types";

export type HintFilterResult = {
  visibleMarkers: HintMarker[];
};

export const applyHintFilter = (
  typed: string,
  visibleMarkers: HintMarker[],
  labelIndex: HintLabelIndex,
  attrs: MarkerDomAttributes
): HintFilterResult => {
  const showAll = typed.length === 0;
  const nextVisibleMarkers = labelIndex.getByPrefix(showAll ? "" : typed);
  const nextVisibleSet = new Set(nextVisibleMarkers);

  for (const hint of visibleMarkers) {
    if (nextVisibleSet.has(hint)) {
      continue;
    }

    if (hint.visible) {
      hint.marker.style.display = "none";
      hint.visible = false;
    }

    if (hint.renderedTyped.length > 0) {
      setMarkerTypedState(hint, "", attrs);
    }
  }

  for (const hint of nextVisibleMarkers) {
    if (!hint.visible) {
      hint.marker.style.display = "";
      hint.visible = true;
    }

    setMarkerTypedState(hint, typed, attrs);
  }

  return {
    visibleMarkers: nextVisibleMarkers
  };
};