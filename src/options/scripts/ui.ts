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

export const rulesUrlsModeBlacklistButtonEl = getElement<HTMLButtonElement>(
  "rules-urls-mode-blacklist-button"
);
export const rulesUrlsModeWhitelistButtonEl = getElement<HTMLButtonElement>(
  "rules-urls-mode-whitelist-button"
);
export const rulesForceNormalModeCheckboxEl = getElement<HTMLInputElement>(
  "rules-force-normal-mode-checkbox"
);
export const rulesUrlsBlacklistSectionEl = getElement<HTMLDivElement>(
  "rules-urls-blacklist-section"
);
export const [rulesUrlsBlacklistContainerEl, rulesUrlsBlacklistTextareaEl] =
  getContainerAndTextarea("rules-urls-blacklist");
export const rulesUrlsBlacklistHighlightEl = getElement<HTMLPreElement>(
  "rules-urls-blacklist-highlight"
);
export const rulesUrlsBlacklistStatusEl = getElement<HTMLParagraphElement>(
  "rules-urls-blacklist-status"
);
export const rulesUrlsWhitelistSectionEl = getElement<HTMLDivElement>(
  "rules-urls-whitelist-section"
);
export const [rulesUrlsWhitelistContainerEl, rulesUrlsWhitelistTextareaEl] =
  getContainerAndTextarea("rules-urls-whitelist");
export const rulesUrlsWhitelistHighlightEl = getElement<HTMLPreElement>(
  "rules-urls-whitelist-highlight"
);
export const rulesUrlsWhitelistStatusEl = getElement<HTMLParagraphElement>(
  "rules-urls-whitelist-status"
);

export const [hotkeysMappingsContainerEl, hotkeysMappingsTextareaEl] = getContainerAndTextarea("hotkeys-mappings");
export const hotkeysMappingsHighlightEl = getElement<HTMLPreElement>("hotkeys-mappings-highlight");
export const hotkeysMappingsStatusEl = getElement<HTMLParagraphElement>("hotkeys-mappings-status");

export const [barColorContainerEl, barColorInputEl] = getContainerAndInput("bar-color");
export const [barSearchEngineURLContainerEl, barSearchEngineURLInputEl] =
  getContainerAndInput("bar-search-engine-url");

export const [findColorContainerEl, findColorInputEl] = getContainerAndInput("find-color");

export const hintsShowCapitalizedLettersCheckboxEl = getElement<HTMLInputElement>(
  "hints-show-capitalized-letters-checkbox"
);
export const hintsImproveThumbnailMarkersCheckboxEl = getElement<HTMLInputElement>(
  "hints-improve-thumbnail-markers-checkbox"
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
export const [hintsMinLabelLengthContainerEl, hintsMinLabelLengthInputEl] =
  getContainerAndInput("hints-min-label-length");
export const [hintsAvoidAdjacentPairsContainerEl, hintsAvoidAdjacentPairsTextareaEl] =
  getContainerAndTextarea("hints-avoid-adjacent-pairs");
export const hintsAvoidAdjacentPairsHighlightEl = getElement<HTMLPreElement>(
  "hints-avoid-adjacent-pairs-highlight"
);
export const hintsAvoidAdjacentPairsStatusEl = getElement<HTMLParagraphElement>(
  "hints-avoid-adjacent-pairs-status"
);
export const [hintsReservedLabelsContainerEl, hintsReservedLabelsTextareaEl] =
  getContainerAndTextarea("hints-reserved-labels");
export const hintsReservedLabelsHighlightEl = getElement<HTMLPreElement>(
  "hints-reserved-labels-highlight"
);
export const hintsReservedLabelsStatusEl = getElement<HTMLParagraphElement>(
  "hints-reserved-labels-status"
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
  },
  {
    container: barColorContainerEl,
    input: barColorInputEl
  },
  {
    container: findColorContainerEl,
    input: findColorInputEl
  }
] as const satisfies Array<{ container: HTMLDivElement; input: HTMLInputElement }>;
