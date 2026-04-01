import { getClosestLinkUrl } from "~/src/core/utils/hint-mode/collection/get-closest-link-url";
import { getElementImageUrl } from "~/src/core/utils/hint-mode/collection/get-element-image-url";
import { getHintableElements } from "~/src/core/utils/hint-mode/collection/get-hintable-elements";
import { generateHintLabels } from "~/src/core/utils/hint-mode/generation/generate-hint-labels";
import { createMarkerElement } from "~/src/core/utils/hint-mode/rendering/create-marker-element";
import { renderMarkerLabel } from "~/src/core/utils/hint-mode/rendering/render-marker-label";
import type { HintActionMode, HintTarget } from "~/src/core/utils/hint-mode/shared/types";

export const buildHintTargets = (
  mode: HintActionMode,
  charset: string,
  minLabelLength: number,
  showCapitalizedLetters: boolean,
  forbiddenLeadingCharacters: string[] = []
): HintTarget[] => {
  const elements = getHintableElements(mode);
  const filteredElements = elements.filter((element) => {
    if (mode === "yank-link-url") {
      return !!getClosestLinkUrl(element);
    }

    if (mode === "yank-image" || mode === "yank-image-url") {
      return !!getElementImageUrl(element);
    }

    return true;
  });

  const labels = generateHintLabels(
    filteredElements.length,
    charset,
    minLabelLength,
    forbiddenLeadingCharacters
  );

  return filteredElements.map((element, index) => {
    const rect = element.getBoundingClientRect();
    const marker = createMarkerElement();
    const target: HintTarget = {
      element,
      label: labels[index] ?? "",
      marker,
      rect,
      imageUrl: getElementImageUrl(element),
      linkUrl: getClosestLinkUrl(element)
    };

    renderMarkerLabel(marker, target.label, 0, showCapitalizedLetters);
    return target;
  });
};