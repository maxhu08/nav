import { type Config } from "~/src/utils/config";
import {
  hintsAvoidAdjacentPairsTextareaEl,
  hintsCharsetInputEl,
  hintsCustomCSSSectionEl,
  hintsCustomCSSTextareaEl,
  hintsImproveThumbnailMarkersCheckboxEl,
  hintsPreferredSearchLabelsInputEl,
  hintsShowActivationIndicatorColorInputEl,
  hintsShowActivationIndicatorColorSectionEl,
  hintsShowActivationIndicatorCheckboxEl,
  hintsShowCapitalizedLettersCheckboxEl,
  hintsStylingCustomButtonEl,
  hintsStylingDefaultButtonEl
} from "~/src/options/scripts/ui";
import { syncHintsAvoidAdjacentPairsHighlight } from "~/src/options/scripts/utils/hints-avoid-adjacent-pairs-highlight";
import { refreshHintsCustomCSSHighlight } from "~/src/options/scripts/utils/hints-custom-css-highlight";
import {
  syncHintsCharsetHighlight,
  syncHintsPreferredSearchLabelsHighlight
} from "~/src/options/scripts/utils/hints-inline-highlight";
import { syncColorInputControl } from "~/src/options/scripts/utils/color-inputs";

const setHintsStylingButtonState = (styling: Config["hints"]["styling"]): void => {
  const isCustom = styling === "custom";

  hintsStylingDefaultButtonEl.setAttribute("aria-pressed", String(!isCustom));
  hintsStylingCustomButtonEl.setAttribute("aria-pressed", String(isCustom));
  hintsStylingDefaultButtonEl.classList.toggle("bg-yellow-500", !isCustom);
  hintsStylingDefaultButtonEl.classList.toggle("hover:bg-yellow-600", !isCustom);
  hintsStylingDefaultButtonEl.classList.toggle("bg-neutral-800", isCustom);
  hintsStylingDefaultButtonEl.classList.toggle("hover:bg-neutral-700", isCustom);
  hintsStylingCustomButtonEl.classList.toggle("bg-yellow-500", isCustom);
  hintsStylingCustomButtonEl.classList.toggle("hover:bg-yellow-600", isCustom);
  hintsStylingCustomButtonEl.classList.toggle("bg-neutral-800", !isCustom);
  hintsStylingCustomButtonEl.classList.toggle("hover:bg-neutral-700", !isCustom);
  hintsCustomCSSSectionEl.classList.toggle("hidden", !isCustom);
  hintsCustomCSSSectionEl.classList.toggle("grid", isCustom);
};

export const syncHintsStylingControls = (styling: Config["hints"]["styling"]): void => {
  setHintsStylingButtonState(styling);
};

export const syncHintsActivationIndicatorColorControls = (
  showActivationIndicator: boolean
): void => {
  hintsShowActivationIndicatorColorSectionEl.classList.toggle("hidden", !showActivationIndicator);
  hintsShowActivationIndicatorColorSectionEl.classList.toggle("grid", showActivationIndicator);
};

export const fillHintsInputs = (config: Config): void => {
  hintsShowCapitalizedLettersCheckboxEl.checked = config.hints.showCapitalizedLetters;
  hintsImproveThumbnailMarkersCheckboxEl.checked = config.hints.improveThumbnailMarkers;
  hintsShowActivationIndicatorCheckboxEl.checked = config.hints.showActivationIndicator;
  hintsShowActivationIndicatorColorInputEl.value = config.hints.showActivationIndicatorColor;
  hintsCustomCSSTextareaEl.value = config.hints.customCSS;
  hintsCharsetInputEl.value = config.hints.charset;
  hintsAvoidAdjacentPairsTextareaEl.value = config.hints.avoidAdjacentPairs;
  hintsPreferredSearchLabelsInputEl.value = config.hints.preferredSearchLabels;
  setHintsStylingButtonState(config.hints.styling);
  syncHintsActivationIndicatorColorControls(config.hints.showActivationIndicator);
  syncColorInputControl(hintsShowActivationIndicatorColorInputEl);
  refreshHintsCustomCSSHighlight();
  syncHintsCharsetHighlight();
  syncHintsAvoidAdjacentPairsHighlight();
  syncHintsPreferredSearchLabelsHighlight();
};
