import {
  hintsAvoidAdjacentPairsContainerEl,
  hintsAvoidAdjacentPairsTextareaEl,
  hintsCustomCSSContainerEl,
  hintsCustomCSSTextareaEl,
  exportButtonEl,
  hintsCharsetContainerEl,
  hintsCharsetInputEl,
  hintsMinLabelLengthContainerEl,
  hintsMinLabelLengthInputEl,
  hintsReservedLabelsContainerEl,
  hintsReservedLabelsTextareaEl,
  hintsShowActivationIndicatorColorContainerEl,
  hintsShowActivationIndicatorColorInputEl,
  hintsShowActivationIndicatorCheckboxEl,
  hintsStylingCustomButtonEl,
  hintsStylingDefaultButtonEl,
  hotkeysMappingsContainerEl,
  hotkeysMappingsTextareaEl,
  importButtonEl,
  resetConfigButtonEl,
  rulesUrlsBlacklistContainerEl,
  rulesUrlsBlacklistTextareaEl,
  rulesUrlsModeBlacklistButtonEl,
  rulesUrlsModeWhitelistButtonEl,
  rulesUrlsWhitelistContainerEl,
  rulesUrlsWhitelistTextareaEl,
  saveButtonEl
} from "~/src/options/scripts/ui";
import { saveAndExportConfig } from "~/src/options/scripts/utils/export-config";
import { importConfigAndSave } from "~/src/options/scripts/utils/import-config";
import {
  syncHotkeysMappingsHighlight,
  syncHotkeysMappingsHighlightScroll
} from "~/src/options/scripts/utils/hotkeys-highlight";
import {
  syncHintsAvoidAdjacentPairsHighlight,
  syncHintsAvoidAdjacentPairsHighlightScroll
} from "~/src/options/scripts/utils/hints-avoid-adjacent-pairs-highlight";
import {
  refreshHintsCustomCSSHighlight,
  syncHintsCustomCSSHighlightScroll
} from "~/src/options/scripts/utils/hints-custom-css-highlight";
import {
  syncHintsCharsetHighlight,
  syncHintsCharsetHighlightScroll,
  syncHintsReservedLabelsHighlight,
  syncHintsReservedLabelsHighlightScroll
} from "~/src/options/scripts/utils/hints-inline-highlight";
import {
  syncHintsActivationIndicatorColorControls,
  syncHintsStylingControls
} from "~/src/options/scripts/utils/fill-helpers/fill-hints";
import { syncRulesUrlsModeControls } from "~/src/options/scripts/utils/fill-helpers/fill-rules";
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

  rulesUrlsModeBlacklistButtonEl.addEventListener("click", () => {
    syncRulesUrlsModeControls("blacklist");
  });

  rulesUrlsModeWhitelistButtonEl.addEventListener("click", () => {
    syncRulesUrlsModeControls("whitelist");
  });

  rulesUrlsBlacklistTextareaEl.addEventListener("focus", () => {
    rulesUrlsBlacklistContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  rulesUrlsBlacklistTextareaEl.addEventListener("input", () => {
    syncRulesUrlsHighlight();
    syncRulesUrlsHighlightScroll();
  });

  rulesUrlsBlacklistTextareaEl.addEventListener("scroll", () => {
    syncRulesUrlsHighlightScroll();
  });

  rulesUrlsBlacklistTextareaEl.addEventListener("blur", () => {
    rulesUrlsBlacklistContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  rulesUrlsWhitelistTextareaEl.addEventListener("focus", () => {
    rulesUrlsWhitelistContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  rulesUrlsWhitelistTextareaEl.addEventListener("input", () => {
    syncRulesUrlsHighlight();
    syncRulesUrlsHighlightScroll();
  });

  rulesUrlsWhitelistTextareaEl.addEventListener("scroll", () => {
    syncRulesUrlsHighlightScroll();
  });

  rulesUrlsWhitelistTextareaEl.addEventListener("blur", () => {
    rulesUrlsWhitelistContainerEl.classList.replace("border-sky-500", "border-transparent");
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

  hintsCharsetInputEl.addEventListener("focus", () => {
    hintsCharsetContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hintsShowActivationIndicatorCheckboxEl.addEventListener("input", () => {
    syncHintsActivationIndicatorColorControls(hintsShowActivationIndicatorCheckboxEl.checked);
  });

  hintsShowActivationIndicatorColorInputEl.addEventListener("focus", () => {
    hintsShowActivationIndicatorColorContainerEl.classList.replace(
      "border-transparent",
      "border-sky-500"
    );
  });

  hintsShowActivationIndicatorColorInputEl.addEventListener("blur", () => {
    hintsShowActivationIndicatorColorContainerEl.classList.replace(
      "border-sky-500",
      "border-transparent"
    );
  });

  hintsCharsetInputEl.addEventListener("input", () => {
    syncHintsCharsetHighlight();
    syncHintsCharsetHighlightScroll();
  });

  hintsCharsetInputEl.addEventListener("scroll", () => {
    syncHintsCharsetHighlightScroll();
  });

  hintsCharsetInputEl.addEventListener("blur", () => {
    hintsCharsetContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  hintsMinLabelLengthInputEl.addEventListener("focus", () => {
    hintsMinLabelLengthContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hintsMinLabelLengthInputEl.addEventListener("blur", () => {
    hintsMinLabelLengthContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  hintsReservedLabelsTextareaEl.addEventListener("focus", () => {
    hintsReservedLabelsContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hintsReservedLabelsTextareaEl.addEventListener("input", () => {
    syncHintsReservedLabelsHighlight();
    syncHintsReservedLabelsHighlightScroll();
  });

  hintsReservedLabelsTextareaEl.addEventListener("scroll", () => {
    syncHintsReservedLabelsHighlightScroll();
  });

  hintsReservedLabelsTextareaEl.addEventListener("blur", () => {
    hintsReservedLabelsContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  hintsAvoidAdjacentPairsTextareaEl.addEventListener("focus", () => {
    hintsAvoidAdjacentPairsContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hintsAvoidAdjacentPairsTextareaEl.addEventListener("input", () => {
    syncHintsAvoidAdjacentPairsHighlight();
    syncHintsAvoidAdjacentPairsHighlightScroll();
  });

  hintsAvoidAdjacentPairsTextareaEl.addEventListener("scroll", () => {
    syncHintsAvoidAdjacentPairsHighlightScroll();
  });

  hintsAvoidAdjacentPairsTextareaEl.addEventListener("blur", () => {
    hintsAvoidAdjacentPairsContainerEl.classList.replace("border-sky-500", "border-transparent");
  });

  hintsStylingDefaultButtonEl.addEventListener("click", () => {
    syncHintsStylingControls("default");
  });

  hintsStylingCustomButtonEl.addEventListener("click", () => {
    syncHintsStylingControls("custom");
  });

  hintsCustomCSSTextareaEl.addEventListener("focus", () => {
    hintsCustomCSSContainerEl.classList.replace("border-transparent", "border-sky-500");
  });

  hintsCustomCSSTextareaEl.addEventListener("input", () => {
    refreshHintsCustomCSSHighlight();
  });

  hintsCustomCSSTextareaEl.addEventListener("scroll", () => {
    syncHintsCustomCSSHighlightScroll();
  });

  hintsCustomCSSTextareaEl.addEventListener("blur", () => {
    hintsCustomCSSContainerEl.classList.replace("border-sky-500", "border-transparent");
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
