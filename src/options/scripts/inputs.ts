import {
  exportButtonEl,
  hotkeysMappingsContainerEl,
  hotkeysMappingsTextareaEl,
  importButtonEl,
  resetConfigButtonEl,
  rulesUrlsContainerEl,
  rulesUrlsTextareaEl,
  saveButtonEl
} from "~/src/options/scripts/ui";
import { saveAndExportConfig } from "~/src/options/scripts/utils/export-config";
import { importConfigAndSave } from "~/src/options/scripts/utils/import-config";
import {
  syncHotkeysMappingsHighlight,
  syncHotkeysMappingsHighlightScroll
} from "~/src/options/scripts/utils/hotkeys-highlight";
import {
  syncRulesUrlsHighlight,
  syncRulesUrlsHighlightScroll
} from "~/src/options/scripts/utils/rules-highlight";
import { saveConfig } from "~/src/options/scripts/utils/save-config";
import { setDefaultConfig } from "~/src/options/scripts/utils/set-default-config";
import { tippy } from "~/src/options/scripts/utils/tooltip";

export const listenToInputs = (): void => {
  saveButtonEl.addEventListener("click", () => {
    void saveConfig();
  });

  exportButtonEl.addEventListener("click", () => {
    void saveAndExportConfig();
  });

  importButtonEl.addEventListener("click", () => {
    void importConfigAndSave();
  });

  resetConfigButtonEl.addEventListener("click", () => {
    setDefaultConfig();
  });

  rulesUrlsTextareaEl.addEventListener("focus", () => {
    rulesUrlsContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  rulesUrlsTextareaEl.addEventListener("input", () => {
    syncRulesUrlsHighlight();
    syncRulesUrlsHighlightScroll();
  });

  rulesUrlsTextareaEl.addEventListener("scroll", () => {
    syncRulesUrlsHighlightScroll();
  });

  rulesUrlsTextareaEl.addEventListener("blur", () => {
    rulesUrlsContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  hotkeysMappingsTextareaEl.addEventListener("focus", () => {
    hotkeysMappingsContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hotkeysMappingsTextareaEl.addEventListener("input", () => {
    syncHotkeysMappingsHighlight();
    syncHotkeysMappingsHighlightScroll();
  });

  hotkeysMappingsTextareaEl.addEventListener("scroll", () => {
    syncHotkeysMappingsHighlightScroll();
  });

  hotkeysMappingsTextareaEl.addEventListener("blur", () => {
    hotkeysMappingsContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  tippy("#save-button", {
    content: "save (ctrl+s)"
  });

  tippy("#export-button", {
    content: "save & export (ctrl+e)"
  });

  tippy("#import-button", {
    content: "import & save (ctrl+i)"
  });
};
