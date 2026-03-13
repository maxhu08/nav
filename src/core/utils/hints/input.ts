import { setMarkerTypedState } from "~/src/core/utils/hints/markers";
import type { HintMarker, MarkerDomAttributes } from "~/src/core/utils/hints/types";

export type HintFilterResult = {
  visibleMarkers: HintMarker[];
  previousTyped: string;
  exactMatch: HintMarker | null;
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
  const nextVisibleMarkers =
    typed.length === 0 ? markers : candidateMarkers.filter((hint) => hint.label.startsWith(typed));
  const nextVisibleSet = new Set(nextVisibleMarkers);

  for (const hint of candidateMarkers) {
    const shouldBeVisible = typed.length === 0 || nextVisibleSet.has(hint);

    if (shouldBeVisible) {
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
    visibleMarkers: nextVisibleMarkers,
    previousTyped: typed,
    exactMatch: nextVisibleMarkers.find((marker) => marker.label === typed) ?? null
  };
};