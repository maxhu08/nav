import { type Config } from "~/src/utils/config";
import {
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsPreferredSearchLabelsInputEl,
  hotkeysHintsShowActivationIndicatorCheckboxEl,
  hotkeysHintsShowCapitalizedLettersCheckboxEl
} from "~/src/options/scripts/ui";
import { syncHotkeysHintsAvoidAdjacentPairsHighlight } from "~/src/options/scripts/utils/hints-avoid-adjacent-pairs-highlight";
import {
  syncHotkeysHintsCharsetHighlight,
  syncHotkeysHintsPreferredSearchLabelsHighlight
} from "~/src/options/scripts/utils/hints-inline-highlight";

export const fillHintsInputs = (config: Config): void => {
  hotkeysHintsShowCapitalizedLettersCheckboxEl.checked = config.hints.showCapitalizedLetters;
  hotkeysHintsShowActivationIndicatorCheckboxEl.checked = config.hints.showActivationIndicator;
  hotkeysHintsCharsetInputEl.value = config.hints.charset;
  hotkeysHintsAvoidAdjacentPairsTextareaEl.value = config.hints.avoidAdjacentPairs;
  hotkeysHintsPreferredSearchLabelsInputEl.value = config.hints.preferredSearchLabels;
  syncHotkeysHintsCharsetHighlight();
  syncHotkeysHintsAvoidAdjacentPairsHighlight();
  syncHotkeysHintsPreferredSearchLabelsHighlight();
};
