import { type Config } from "~/src/utils/config";
import { hotkeysHintsCharsetInputEl, hotkeysMappingsTextareaEl } from "~/src/options/scripts/ui";

export const saveHotkeysSettingsToDraft = (draft: Config): void => {
  draft.hotkeys.mappings = hotkeysMappingsTextareaEl.value;
  draft.hotkeys.hints.charset = hotkeysHintsCharsetInputEl.value;
};
