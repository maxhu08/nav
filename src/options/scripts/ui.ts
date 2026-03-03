import {
  getButton,
  getContainerAndInput,
  getContainerAndTextarea,
  getElement
} from "~/src/options/scripts/utils/ui-helpers";

export const saveButtonEl = getButton("save");
export const exportButtonEl = getButton("export");
export const importButtonEl = getButton("import");
export const resetConfigButtonEl = getButton("reset-config");

export const [rulesUrlsContainerEl, rulesUrlsTextareaEl] = getContainerAndTextarea("rules-urls");
export const rulesUrlsHighlightEl = getElement<HTMLPreElement>("rules-urls-highlight");
export const rulesUrlsStatusEl = getElement<HTMLParagraphElement>("rules-urls-status");

export const [hotkeysMappingsContainerEl, hotkeysMappingsTextareaEl] = getContainerAndTextarea("hotkeys-mappings");
export const hotkeysMappingsHighlightEl = getElement<HTMLPreElement>("hotkeys-mappings-highlight");
export const hotkeysMappingsStatusEl = getElement<HTMLParagraphElement>("hotkeys-mappings-status");

export const hintsShowCapitalizedLettersCheckboxEl = getElement<HTMLInputElement>(
  "hints-show-capitalized-letters-checkbox"
);
export const hintsHighlightThumbnailsCheckboxEl = getElement<HTMLInputElement>(
  "hints-highlight-thumbnails-checkbox"
);
export const hintsShowActivationIndicatorCheckboxEl = getElement<HTMLInputElement>(
  "hints-show-activation-indicator-checkbox"
);
export const hintsShowActivationIndicatorColorSectionEl = getElement<HTMLDivElement>(
  "hints-show-activation-indicator-color-section"
);
export const [hintsShowActivationIndicatorColorContainerEl, hintsShowActivationIndicatorColorInputEl] =
  getContainerAndInput("hints-show-activation-indicator-color");
export const hintsCharsetContainerEl = getElement<HTMLDivElement>("hints-charset-container");
export const hintsCharsetInputEl = getElement<HTMLInputElement>("hints-charset-input");
export const hintsCharsetHighlightEl = getElement<HTMLPreElement>("hints-charset-highlight");
export const hintsCharsetStatusEl = getElement<HTMLParagraphElement>("hints-charset-status");
export const [hintsAvoidAdjacentPairsContainerEl, hintsAvoidAdjacentPairsTextareaEl] =
  getContainerAndTextarea("hints-avoid-adjacent-pairs");
export const hintsAvoidAdjacentPairsHighlightEl = getElement<HTMLPreElement>(
  "hints-avoid-adjacent-pairs-highlight"
);
export const hintsAvoidAdjacentPairsStatusEl = getElement<HTMLParagraphElement>(
  "hints-avoid-adjacent-pairs-status"
);
export const hintsPreferredSearchLabelsContainerEl = getElement<HTMLDivElement>(
  "hints-preferred-search-labels-container"
);
export const hintsPreferredSearchLabelsInputEl = getElement<HTMLInputElement>(
  "hints-preferred-search-labels-input"
);
export const hintsPreferredSearchLabelsHighlightEl = getElement<HTMLPreElement>(
  "hints-preferred-search-labels-highlight"
);
export const hintsPreferredSearchLabelsStatusEl = getElement<HTMLParagraphElement>(
  "hints-preferred-search-labels-status"
);
export const hintsStylingDefaultButtonEl = getElement<HTMLButtonElement>(
  "hints-styling-default-button"
);
export const hintsStylingCustomButtonEl = getElement<HTMLButtonElement>(
  "hints-styling-custom-button"
);
export const hintsCustomCSSSectionEl = getElement<HTMLDivElement>("hints-custom-css-section");
export const [hintsCustomCSSContainerEl, hintsCustomCSSTextareaEl] =
  getContainerAndTextarea("hints-custom-css");
export const hintsCustomCSSHighlightEl = getElement<HTMLPreElement>(
  "hints-custom-css-highlight"
);

export const colorInputs = [
  {
    container: hintsShowActivationIndicatorColorContainerEl,
    input: hintsShowActivationIndicatorColorInputEl
  }
] as const satisfies Array<{ container: HTMLDivElement; input: HTMLInputElement }>;
