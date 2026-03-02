import { type Config } from "~/src/utils/config";
import { hotkeysMappingsTextareaEl } from "~/src/options/scripts/ui";
import {
  syncHotkeysMappingsHighlight,
  syncHotkeysMappingsHighlightScroll
} from "~/src/options/scripts/utils/hotkeys-highlight";

export const fillHotkeysInputs = (config: Config): void => {
  hotkeysMappingsTextareaEl.value = config.hotkeys.mappings;
  syncHotkeysMappingsHighlight();
  syncHotkeysMappingsHighlightScroll();
};
