import { DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/config";
import {
  hotkeysMappingsContainerEl,
  hotkeysMappingsTextareaEl,
  resetConfigButtonEl,
  saveConfigButtonEl
} from "~/src/options/scripts/ui";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { saveConfig } from "~/src/options/scripts/utils/save-config";

export const listenToInputs = (): void => {
  saveConfigButtonEl.addEventListener("click", () => {
    saveConfig();
  });

  resetConfigButtonEl.addEventListener("click", () => {
    hotkeysMappingsTextareaEl.value = DEFAULT_HOTKEY_MAPPINGS;
    getToastApi()?.info("restored defaults");
  });

  hotkeysMappingsTextareaEl.addEventListener("focus", () => {
    hotkeysMappingsContainerEl.classList.replace("border-transparent", "border-yellow-500");
  });

  hotkeysMappingsTextareaEl.addEventListener("blur", () => {
    hotkeysMappingsContainerEl.classList.replace("border-yellow-500", "border-transparent");
  });
};
