import { type Config } from "~/src/utils/config";
import {
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsShowActivationIndicatorCheckboxEl,
  hotkeysMappingsTextareaEl
} from "~/src/options/scripts/ui";
import { syncHotkeysHintsAvoidAdjacentPairsHighlight } from "~/src/options/scripts/utils/hints-avoid-adjacent-pairs-highlight";
import {
  syncHotkeysMappingsHighlight,
  syncHotkeysMappingsHighlightScroll
} from "~/src/options/scripts/utils/hotkeys-highlight";

export const fillHotkeysInputs = (config: Config): void => {
  hotkeysMappingsTextareaEl.value = config.hotkeys.mappings;
  hotkeysHintsCharsetInputEl.value = config.hotkeys.hints.charset;
  hotkeysHintsAvoidAdjacentPairsTextareaEl.value = config.hotkeys.hints.avoidAdjacentPairs;
  hotkeysHintsShowActivationIndicatorCheckboxEl.checked =
    config.hotkeys.hints.showActivationIndicator;
  syncHotkeysHintsAvoidAdjacentPairsHighlight();
  syncHotkeysMappingsHighlight();
  syncHotkeysMappingsHighlightScroll();
};
