import { type Config } from "~/src/utils/config";
import {
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsPreferredSearchLabelsInputEl,
  hotkeysHintsShowActivationIndicatorCheckboxEl,
  hotkeysHintsShowCapitalizedLettersCheckboxEl
} from "~/src/options/scripts/ui";

export const saveHintsSettingsToDraft = (draft: Config): void => {
  draft.hints.showCapitalizedLetters = hotkeysHintsShowCapitalizedLettersCheckboxEl.checked;
  draft.hints.showActivationIndicator = hotkeysHintsShowActivationIndicatorCheckboxEl.checked;
  draft.hints.charset = hotkeysHintsCharsetInputEl.value;
  draft.hints.avoidAdjacentPairs = hotkeysHintsAvoidAdjacentPairsTextareaEl.value;
  draft.hints.preferredSearchLabels = hotkeysHintsPreferredSearchLabelsInputEl.value;
};
