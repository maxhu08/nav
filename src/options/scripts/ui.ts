import { getButton, getContainerAndTextarea, getElement } from "~/src/options/scripts/utils/ui-helpers";

// prettier-ignore
export const [rulesUrlsContainerEl, rulesUrlsTextareaEl] = getContainerAndTextarea("rules-urls");
export const rulesUrlsHighlightEl = getElement<HTMLPreElement>("rules-urls-highlight");
// prettier-ignore
export const [hotkeysMappingsContainerEl, hotkeysMappingsTextareaEl] = getContainerAndTextarea("hotkeys-mappings");
export const hotkeysMappingsHighlightEl = getElement<HTMLPreElement>("hotkeys-mappings-highlight");
export const hotkeysHintsCharsetContainerEl = getElement<HTMLDivElement>("hotkeys-hints-charset-container");
export const hotkeysHintsCharsetInputEl = getElement<HTMLInputElement>("hotkeys-hints-charset-input");
export const [hotkeysHintsAvoidAdjacentPairsContainerEl, hotkeysHintsAvoidAdjacentPairsTextareaEl] =
  getContainerAndTextarea("hotkeys-hints-avoid-adjacent-pairs");
export const hotkeysHintsAvoidAdjacentPairsHighlightEl = getElement<HTMLPreElement>(
  "hotkeys-hints-avoid-adjacent-pairs-highlight"
);
export const hotkeysHintsShowActivationIndicatorCheckboxEl = getElement<HTMLInputElement>(
  "hotkeys-hints-show-activation-indicator-checkbox"
);

export const saveButtonEl = getButton("save");
export const exportButtonEl = getButton("export");
export const importButtonEl = getButton("import");
export const resetConfigButtonEl = getButton("reset-config");
