import { type Config } from "~/src/utils/config";
import {
  hintsAvoidAdjacentPairsTextareaEl,
  hintsCharsetInputEl,
  hintsCustomCSSTextareaEl,
  hintsPreferredSearchLabelsInputEl,
  hintsShowActivationIndicatorCheckboxEl,
  hintsShowCapitalizedLettersCheckboxEl,
  hintsStylingCustomButtonEl
} from "~/src/options/scripts/ui";

export const saveHintsSettingsToDraft = (draft: Config): void => {
  draft.hints.showCapitalizedLetters = hintsShowCapitalizedLettersCheckboxEl.checked;
  draft.hints.showActivationIndicator = hintsShowActivationIndicatorCheckboxEl.checked;
  draft.hints.styling =
    hintsStylingCustomButtonEl.getAttribute("aria-pressed") === "true" ? "custom" : "default";
  draft.hints.customCSS = hintsCustomCSSTextareaEl.value;
  draft.hints.charset = hintsCharsetInputEl.value;
  draft.hints.avoidAdjacentPairs = hintsAvoidAdjacentPairsTextareaEl.value;
  draft.hints.preferredSearchLabels = hintsPreferredSearchLabelsInputEl.value;
};
