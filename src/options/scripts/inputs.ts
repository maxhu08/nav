import { DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/hotkeys";
import {
  hotkeysMappingsContainerEl,
  hotkeysMappingsTextareaEl,
  resetConfigButtonEl,
  rulesUrlsContainerEl,
  rulesUrlsTextareaEl,
  saveConfigButtonEl
} from "~/src/options/scripts/ui";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { saveConfig } from "~/src/options/scripts/utils/save-config";

export const listenToInputs = (): void => {
  saveConfigButtonEl.addEventListener("click", () => {
    saveConfig();
  });

  resetConfigButtonEl.addEventListener("click", () => {
    rulesUrlsTextareaEl.value = "";
    hotkeysMappingsTextareaEl.value = DEFAULT_HOTKEY_MAPPINGS;
    getToastApi()?.info("restored defaults");
  });

  rulesUrlsTextareaEl.addEventListener("focus", () => {
    rulesUrlsContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  rulesUrlsTextareaEl.addEventListener("blur", () => {
    rulesUrlsContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  hotkeysMappingsTextareaEl.addEventListener("focus", () => {
    hotkeysMappingsContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hotkeysMappingsTextareaEl.addEventListener("blur", () => {
    hotkeysMappingsContainerEl.classList.replace("border-sky-500", "border-transparent");
  });
};
