import { type Config } from "~/src/utils/config";
import {
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsCustomCSSTextareaEl,
  hotkeysHintsPreferredSearchLabelsInputEl,
  hotkeysHintsShowActivationIndicatorCheckboxEl,
  hotkeysHintsShowCapitalizedLettersCheckboxEl,
  hotkeysHintsStylingCustomButtonEl
} from "~/src/options/scripts/ui";

export const saveHintsSettingsToDraft = (draft: Config): void => {
  draft.hints.showCapitalizedLetters = hotkeysHintsShowCapitalizedLettersCheckboxEl.checked;
  draft.hints.showActivationIndicator = hotkeysHintsShowActivationIndicatorCheckboxEl.checked;
  draft.hints.styling =
    hotkeysHintsStylingCustomButtonEl.getAttribute("aria-pressed") === "true"
      ? "custom"
      : "default";
  draft.hints.customCSS = hotkeysHintsCustomCSSTextareaEl.value;
  draft.hints.charset = hotkeysHintsCharsetInputEl.value;
  draft.hints.avoidAdjacentPairs = hotkeysHintsAvoidAdjacentPairsTextareaEl.value;
  draft.hints.preferredSearchLabels = hotkeysHintsPreferredSearchLabelsInputEl.value;
};
