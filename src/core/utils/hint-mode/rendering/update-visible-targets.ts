import { renderMarkerLabel } from "~/src/core/utils/hint-mode/rendering/render-marker-label";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

export const updateVisibleTargets = (
  targets: HintTarget[],
  typedPrefix: string,
  showCapitalizedLetters: boolean
): HintTarget[] => {
  const matches: HintTarget[] = [];

  for (const target of targets) {
    const isVisible = target.label.startsWith(typedPrefix);
    target.marker.setAttribute("data-visible", isVisible ? "true" : "false");
    if (isVisible) {
      matches.push(target);
      renderMarkerLabel(target.marker, target.label, typedPrefix.length, showCapitalizedLetters);
    }
  }

  return matches;
};