import { getContainerAndTextarea, getElement } from "~/src/options/scripts/utils/ui-helpers";

export const [popupRuleEditorContainerEl, popupRuleEditorTextareaEl] = getContainerAndTextarea("popup-rule-editor");
export const popupRuleEditorHighlightEl = getElement<HTMLPreElement>("popup-rule-editor-highlight");
export const popupStatusTextEl = getElement<HTMLParagraphElement>("popup-status-text");
