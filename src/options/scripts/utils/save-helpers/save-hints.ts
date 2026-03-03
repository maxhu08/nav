import { type Config } from "~/src/utils/config";
import {
  hintsAvoidAdjacentPairsTextareaEl,
  hintsHighlightThumbnailsCheckboxEl,
  hintsCharsetInputEl,
  hintsCustomCSSTextareaEl,
  hintsPreferredSearchLabelsInputEl,
  hintsShowActivationIndicatorColorInputEl,
  hintsShowActivationIndicatorCheckboxEl,
  hintsShowCapitalizedLettersCheckboxEl,
  hintsStylingCustomButtonEl
} from "~/src/options/scripts/ui";

export const saveHintsSettingsToDraft = (draft: Config): void => {
  draft.hints.showCapitalizedLetters = hintsShowCapitalizedLettersCheckboxEl.checked;
  draft.hints.highlightThumbnails = hintsHighlightThumbnailsCheckboxEl.checked;
  draft.hints.showActivationIndicator = hintsShowActivationIndicatorCheckboxEl.checked;
  draft.hints.showActivationIndicatorColor = hintsShowActivationIndicatorColorInputEl.value;
  draft.hints.styling =
    hintsStylingCustomButtonEl.getAttribute("aria-pressed") === "true" ? "custom" : "default";
  draft.hints.customCSS = hintsCustomCSSTextareaEl.value;
  draft.hints.charset = hintsCharsetInputEl.value;
  draft.hints.avoidAdjacentPairs = hintsAvoidAdjacentPairsTextareaEl.value;
  draft.hints.preferredSearchLabels = hintsPreferredSearchLabelsInputEl.value;
};
