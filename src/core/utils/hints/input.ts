import { setMarkerTypedState } from "~/src/core/utils/hints/markers";
import type { HintMarker, MarkerDomAttributes } from "~/src/core/utils/hints/types";

export type HintFilterResult = {
  visibleMarkers: HintMarker[];
  previousTyped: string;
};

export const applyHintFilter = (
  typed: string,
  previousTyped: string,
  markers: HintMarker[],
  visibleMarkers: HintMarker[],
  attrs: MarkerDomAttributes
): HintFilterResult => {
  const isNarrowing = typed.startsWith(previousTyped);
  const candidateMarkers = isNarrowing ? visibleMarkers : markers;
  const nextVisibleMarkers: HintMarker[] = [];
  const showAll = typed.length === 0;

  for (const hint of candidateMarkers) {
    const shouldBeVisible = showAll || hint.label.startsWith(typed);

    if (shouldBeVisible) {
      nextVisibleMarkers.push(hint);
      if (!hint.visible) {
        hint.marker.style.display = "";
        hint.visible = true;
      }

      setMarkerTypedState(hint, typed, attrs);
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

  return {
    visibleMarkers: showAll ? markers : nextVisibleMarkers,
    previousTyped: typed
  };
};