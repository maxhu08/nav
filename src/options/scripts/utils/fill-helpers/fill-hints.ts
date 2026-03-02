import { type Config } from "~/src/utils/config";
import {
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsCustomCSSSectionEl,
  hotkeysHintsCustomCSSTextareaEl,
  hotkeysHintsPreferredSearchLabelsInputEl,
  hotkeysHintsShowActivationIndicatorCheckboxEl,
  hotkeysHintsShowCapitalizedLettersCheckboxEl,
  hotkeysHintsStylingCustomButtonEl,
  hotkeysHintsStylingDefaultButtonEl
} from "~/src/options/scripts/ui";
import { syncHotkeysHintsAvoidAdjacentPairsHighlight } from "~/src/options/scripts/utils/hints-avoid-adjacent-pairs-highlight";
import { refreshHotkeysHintsCustomCSSHighlight } from "~/src/options/scripts/utils/hints-custom-css-highlight";
import {
  syncHotkeysHintsCharsetHighlight,
  syncHotkeysHintsPreferredSearchLabelsHighlight
} from "~/src/options/scripts/utils/hints-inline-highlight";

const setHintsStylingButtonState = (styling: Config["hints"]["styling"]): void => {
  const isCustom = styling === "custom";

  hotkeysHintsStylingDefaultButtonEl.setAttribute("aria-pressed", String(!isCustom));
  hotkeysHintsStylingCustomButtonEl.setAttribute("aria-pressed", String(isCustom));
  hotkeysHintsStylingDefaultButtonEl.classList.toggle("bg-yellow-500", !isCustom);
  hotkeysHintsStylingDefaultButtonEl.classList.toggle("hover:bg-yellow-600", !isCustom);
  hotkeysHintsStylingDefaultButtonEl.classList.toggle("bg-neutral-800", isCustom);
  hotkeysHintsStylingDefaultButtonEl.classList.toggle("hover:bg-neutral-700", isCustom);
  hotkeysHintsStylingCustomButtonEl.classList.toggle("bg-yellow-500", isCustom);
  hotkeysHintsStylingCustomButtonEl.classList.toggle("hover:bg-yellow-600", isCustom);
  hotkeysHintsStylingCustomButtonEl.classList.toggle("bg-neutral-800", !isCustom);
  hotkeysHintsStylingCustomButtonEl.classList.toggle("hover:bg-neutral-700", !isCustom);
  hotkeysHintsCustomCSSSectionEl.classList.toggle("hidden", !isCustom);
  hotkeysHintsCustomCSSSectionEl.classList.toggle("grid", isCustom);
};

export const syncHintsStylingControls = (styling: Config["hints"]["styling"]): void => {
  setHintsStylingButtonState(styling);
};

export const fillHintsInputs = (config: Config): void => {
  hotkeysHintsShowCapitalizedLettersCheckboxEl.checked = config.hints.showCapitalizedLetters;
  hotkeysHintsShowActivationIndicatorCheckboxEl.checked = config.hints.showActivationIndicator;
  hotkeysHintsCustomCSSTextareaEl.value = config.hints.customCSS;
  hotkeysHintsCharsetInputEl.value = config.hints.charset;
  hotkeysHintsAvoidAdjacentPairsTextareaEl.value = config.hints.avoidAdjacentPairs;
  hotkeysHintsPreferredSearchLabelsInputEl.value = config.hints.preferredSearchLabels;
  setHintsStylingButtonState(config.hints.styling);
  refreshHotkeysHintsCustomCSSHighlight();
  syncHotkeysHintsCharsetHighlight();
  syncHotkeysHintsAvoidAdjacentPairsHighlight();
  syncHotkeysHintsPreferredSearchLabelsHighlight();
};
