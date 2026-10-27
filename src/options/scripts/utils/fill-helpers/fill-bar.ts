import { type Config } from "~/src/utils/config";
import {
  barColorInputEl,
  barTabsColorInputEl,
  barWidthInputEl,
  barTextSizeInputEl,
  barSearchBookmarksCheckboxEl,
  barSearchBookmarksStorageSectionEl,
  barSearchBookmarksStorageTextareaEl,
  barSearchHistoryCheckboxEl,
  barSearchTabsCheckboxEl,
  barSearchEngineURLInputEl,
  barSearchSuggestionsCheckboxEl
} from "~/src/options/scripts/ui";
import { syncColorInputControl } from "~/src/options/scripts/utils/color-inputs";
import { barStylingControls } from "~/src/options/scripts/utils/prompt-styling";
import {
  syncBarSearchBookmarksStorageHighlight,
  syncBarSearchBookmarksStorageHighlightScroll
} from "~/src/options/scripts/utils/bar-bookmarks-highlight";

export const syncBarSearchBookmarksStorageControls = (enabled: boolean): void => {
  barSearchBookmarksStorageSectionEl.classList.toggle("hidden", !enabled);
  barSearchBookmarksStorageSectionEl.classList.toggle("grid", enabled);
};

export const fillBarInputs = (config: Config): void => {
  barStylingControls.fill(config.bar);
  barColorInputEl.value = config.bar.color;
  barTabsColorInputEl.value = config.bar.tabsColor;
  barWidthInputEl.value = config.bar.width.toString();
  barTextSizeInputEl.value = config.bar.textSize.toString();
  barSearchEngineURLInputEl.value = config.bar.searchEngineURL;
  barSearchSuggestionsCheckboxEl.checked = config.bar.search.suggestions;
  barSearchHistoryCheckboxEl.checked = config.bar.search.history;
  barSearchTabsCheckboxEl.checked = config.bar.search.tabs;
  barSearchBookmarksCheckboxEl.checked = config.bar.search.bookmarks.enabled;
  barSearchBookmarksStorageTextareaEl.value = config.bar.search.bookmarks.storage;
  syncBarSearchBookmarksStorageControls(config.bar.search.bookmarks.enabled);
  syncBarSearchBookmarksStorageHighlight();
  syncBarSearchBookmarksStorageHighlightScroll();
  syncColorInputControl(barColorInputEl);
  syncColorInputControl(barTabsColorInputEl);
};