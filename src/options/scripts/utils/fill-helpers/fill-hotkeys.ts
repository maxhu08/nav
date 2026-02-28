import { type Config } from "~/src/utils/config";
import { hotkeysMappingsTextareaEl } from "~/src/options/scripts/ui";
export const fillHotkeysInputs = (config: Config): void => {
  hotkeysMappingsTextareaEl.value = config.hotkeys.mappings;
};
