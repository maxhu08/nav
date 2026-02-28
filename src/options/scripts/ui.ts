import {
  getButton,
  getContainerAndTextarea,
  getElement
} from "~/src/options/scripts/utils/ui-helpers";

export const [rulesUrlsContainerEl, rulesUrlsTextareaEl] =
  getContainerAndTextarea("rules-urls");
export const rulesUrlsHighlightEl = getElement<HTMLPreElement>("rules-urls-highlight");
export const [hotkeysMappingsContainerEl, hotkeysMappingsTextareaEl] =
  getContainerAndTextarea("hotkeys-mappings");
export const hotkeysMappingsHighlightEl =
  getElement<HTMLPreElement>("hotkeys-mappings-highlight");

export const saveButtonEl = getButton("save");
export const exportButtonEl = getButton("export");
export const importButtonEl = getButton("import");
export const resetConfigButtonEl = getButton("reset-config");
