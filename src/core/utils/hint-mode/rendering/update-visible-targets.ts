import { renderMarkerLabel } from "~/src/core/utils/hint-mode/rendering/render-marker-label";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

export const updateVisibleTargets = (
  targets: HintTarget[],
  typedPrefix: string,
  showCapitalizedLetters: boolean
): HintTarget[] => {
  const matches = targets.filter((target) => target.label.startsWith(typedPrefix));

  for (const target of targets) {
    const isVisible = matches.includes(target);
    target.marker.setAttribute("data-visible", isVisible ? "true" : "false");
    if (isVisible) {
      renderMarkerLabel(target.marker, target.label, typedPrefix.length, showCapitalizedLetters);
    }
  }

  return matches;
};