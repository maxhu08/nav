import {
  hotkeysHintsAvoidAdjacentPairsContainerEl,
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysHintsCustomCSSContainerEl,
  hotkeysHintsCustomCSSTextareaEl,
  exportButtonEl,
  hotkeysHintsCharsetContainerEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsPreferredSearchLabelsContainerEl,
  hotkeysHintsPreferredSearchLabelsInputEl,
  hotkeysHintsStylingCustomButtonEl,
  hotkeysHintsStylingDefaultButtonEl,
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
  normalizeAvoidAdjacentPairsValue,
  syncHotkeysHintsAvoidAdjacentPairsHighlight,
  syncHotkeysHintsAvoidAdjacentPairsHighlightScroll
} from "~/src/options/scripts/utils/hints-avoid-adjacent-pairs-highlight";
import {
  refreshHotkeysHintsCustomCSSHighlight,
  syncHotkeysHintsCustomCSSHighlightScroll
} from "~/src/options/scripts/utils/hints-custom-css-highlight";
import {
  syncHotkeysHintsCharsetHighlight,
  syncHotkeysHintsCharsetHighlightScroll,
  syncHotkeysHintsPreferredSearchLabelsHighlight,
  syncHotkeysHintsPreferredSearchLabelsHighlightScroll
} from "~/src/options/scripts/utils/hints-inline-highlight";
import { syncHintsStylingControls } from "~/src/options/scripts/utils/fill-helpers/fill-hints";
import {
  syncRulesUrlsHighlight,
  syncRulesUrlsHighlightScroll
} from "~/src/options/scripts/utils/rules-highlight";
import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { setDefaultConfig } from "~/src/options/scripts/utils/set-default-config";
import { tippy } from "~/src/options/scripts/utils/tooltip";

export const listenToInputs = (): void => {
  saveButtonEl.addEventListener("click", () => {
    void saveConfigAndFastConfig();
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

  hotkeysHintsCharsetInputEl.addEventListener("focus", () => {
    hotkeysHintsCharsetContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hotkeysHintsCharsetInputEl.addEventListener("input", () => {
    syncHotkeysHintsCharsetHighlight();
    syncHotkeysHintsCharsetHighlightScroll();
  });

  hotkeysHintsCharsetInputEl.addEventListener("scroll", () => {
    syncHotkeysHintsCharsetHighlightScroll();
  });

  hotkeysHintsCharsetInputEl.addEventListener("blur", () => {
    hotkeysHintsCharsetContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  hotkeysHintsPreferredSearchLabelsInputEl.addEventListener("focus", () => {
    hotkeysHintsPreferredSearchLabelsContainerEl.classList.replace(
      "border-transparent",
      "border-sky-500"
    );
  });

  hotkeysHintsPreferredSearchLabelsInputEl.addEventListener("input", () => {
    syncHotkeysHintsPreferredSearchLabelsHighlight();
    syncHotkeysHintsPreferredSearchLabelsHighlightScroll();
  });

  hotkeysHintsPreferredSearchLabelsInputEl.addEventListener("scroll", () => {
    syncHotkeysHintsPreferredSearchLabelsHighlightScroll();
  });

  hotkeysHintsPreferredSearchLabelsInputEl.addEventListener("blur", () => {
    hotkeysHintsPreferredSearchLabelsContainerEl.classList.replace(
      "border-sky-500",
      "border-transparent"
    );
  });

  hotkeysHintsAvoidAdjacentPairsTextareaEl.addEventListener("focus", () => {
    hotkeysHintsAvoidAdjacentPairsContainerEl.classList.replace(
      "border-transparent",
      "border-sky-500"
    );
  });

  hotkeysHintsAvoidAdjacentPairsTextareaEl.addEventListener("input", () => {
    const normalizedValue = normalizeAvoidAdjacentPairsValue(
      hotkeysHintsAvoidAdjacentPairsTextareaEl.value
    );

    if (hotkeysHintsAvoidAdjacentPairsTextareaEl.value !== normalizedValue) {
      const selectionStart = hotkeysHintsAvoidAdjacentPairsTextareaEl.selectionStart;
      hotkeysHintsAvoidAdjacentPairsTextareaEl.value = normalizedValue;

      if (selectionStart !== null) {
        hotkeysHintsAvoidAdjacentPairsTextareaEl.setSelectionRange(selectionStart, selectionStart);
      }
    }

    syncHotkeysHintsAvoidAdjacentPairsHighlight();
    syncHotkeysHintsAvoidAdjacentPairsHighlightScroll();
  });

  hotkeysHintsAvoidAdjacentPairsTextareaEl.addEventListener("scroll", () => {
    syncHotkeysHintsAvoidAdjacentPairsHighlightScroll();
  });

  hotkeysHintsAvoidAdjacentPairsTextareaEl.addEventListener("blur", () => {
    hotkeysHintsAvoidAdjacentPairsContainerEl.classList.replace(
      "border-sky-500",
      "border-transparent"
    );
  });

  hotkeysHintsStylingDefaultButtonEl.addEventListener("click", () => {
    syncHintsStylingControls("default");
  });

  hotkeysHintsStylingCustomButtonEl.addEventListener("click", () => {
    syncHintsStylingControls("custom");
  });

  hotkeysHintsCustomCSSTextareaEl.addEventListener("focus", () => {
    hotkeysHintsCustomCSSContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hotkeysHintsCustomCSSTextareaEl.addEventListener("input", () => {
    refreshHotkeysHintsCustomCSSHighlight();
  });

  hotkeysHintsCustomCSSTextareaEl.addEventListener("scroll", () => {
    syncHotkeysHintsCustomCSSHighlightScroll();
  });

  hotkeysHintsCustomCSSTextareaEl.addEventListener("blur", () => {
    hotkeysHintsCustomCSSContainerEl.classList.replace("border-sky-500", "border-transparent");
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
