import { type Config } from "~/src/utils/config";
import {
  hotkeysHintsCharsetInputEl,
  hotkeysHintsShowActivationIndicatorCheckboxEl,
  hotkeysMappingsTextareaEl
} from "~/src/options/scripts/ui";
import {
  syncHotkeysMappingsHighlight,
  syncHotkeysMappingsHighlightScroll
} from "~/src/options/scripts/utils/hotkeys-highlight";

export const fillHotkeysInputs = (config: Config): void => {
  hotkeysMappingsTextareaEl.value = config.hotkeys.mappings;
  hotkeysHintsCharsetInputEl.value = config.hotkeys.hints.charset;
  hotkeysHintsShowActivationIndicatorCheckboxEl.checked =
    config.hotkeys.hints.showActivationIndicator;
  syncHotkeysMappingsHighlight();
  syncHotkeysMappingsHighlightScroll();
};
