import {
  getButton,
  getContainerAndTextarea
} from "~/src/options/scripts/utils/ui-helpers";

export const [rulesUrlsContainerEl, rulesUrlsTextareaEl] =
  getContainerAndTextarea("rules-urls");
export const [hotkeysMappingsContainerEl, hotkeysMappingsTextareaEl] =
  getContainerAndTextarea("hotkeys-mappings");

export const saveConfigButtonEl = getButton("save-config");
export const resetConfigButtonEl = getButton("reset-config");
