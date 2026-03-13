import { type Config } from "~/src/utils/config";
import { hotkeysMappingsTextareaEl } from "~/src/options/scripts/ui";

export const saveHotkeysSettingsToDraft = (draft: Config): void => {
  draft.hotkeys.mappings = hotkeysMappingsTextareaEl.value;
};