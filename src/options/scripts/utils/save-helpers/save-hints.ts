import { type Config } from "~/src/utils/config";
import {
  hintsAvoidAdjacentPairsTextareaEl,
  hintsCharsetInputEl,
  hintsCustomSelectorsTextareaEl,
  hintsCustomCSSTextareaEl,
  hintsImproveThumbnailMarkersCheckboxEl,
  hintsMinLabelLengthInputEl,
  hintsReservedLabelsTextareaEl,
  hintsShowActivationIndicatorColorInputEl,
  hintsShowActivationIndicatorCheckboxEl,
  hintsShowCapitalizedLettersCheckboxEl,
  hintsStylingCustomButtonEl
} from "~/src/options/scripts/ui";

export const saveHintsSettingsToDraft = (draft: Config): void => {
  draft.hints.showCapitalizedLetters = hintsShowCapitalizedLettersCheckboxEl.checked;
  draft.hints.improveThumbnailMarkers = hintsImproveThumbnailMarkersCheckboxEl.checked;
  draft.hints.minLabelLength = Math.max(
    1,
    Number.parseInt(hintsMinLabelLengthInputEl.value, 10) || 2
  );
  draft.hints.activationIndicator.enabled = hintsShowActivationIndicatorCheckboxEl.checked;
  draft.hints.activationIndicator.color = hintsShowActivationIndicatorColorInputEl.value;
  draft.hints.styling =
    hintsStylingCustomButtonEl.getAttribute("aria-pressed") === "true" ? "custom" : "default";
  draft.hints.customCSS = hintsCustomCSSTextareaEl.value;
  draft.hints.advanced.customSelectors = hintsCustomSelectorsTextareaEl.value;
  draft.hints.charset = hintsCharsetInputEl.value;
  draft.hints.avoidAdjacentPairs = hintsAvoidAdjacentPairsTextareaEl.value;
  draft.hints.directives = hintsReservedLabelsTextareaEl.value;
};