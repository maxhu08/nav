import { type Config } from "~/src/utils/config";
import {
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsPreferredSearchLabelsInputEl,
  hotkeysHintsShowCapitalizedLettersCheckboxEl,
  hotkeysHintsShowActivationIndicatorCheckboxEl,
  hotkeysMappingsTextareaEl
} from "~/src/options/scripts/ui";

export const saveHotkeysSettingsToDraft = (draft: Config): void => {
  draft.hotkeys.mappings = hotkeysMappingsTextareaEl.value;
  draft.hotkeys.hints.charset = hotkeysHintsCharsetInputEl.value;
  draft.hotkeys.hints.avoidAdjacentPairs = hotkeysHintsAvoidAdjacentPairsTextareaEl.value;
  draft.hotkeys.hints.preferredSearchLabels = hotkeysHintsPreferredSearchLabelsInputEl.value;
  draft.hotkeys.hints.showCapitalizedLetters = hotkeysHintsShowCapitalizedLettersCheckboxEl.checked;
  draft.hotkeys.hints.showActivationIndicator =
    hotkeysHintsShowActivationIndicatorCheckboxEl.checked;
};
