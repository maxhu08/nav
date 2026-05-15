import { type Config } from "~/src/utils/config";
import {
  barColorInputEl,
  barSearchBookmarksCheckboxEl,
  barSearchBookmarksStorageSectionEl,
  barSearchBookmarksStorageTextareaEl,
  barSearchHistoryCheckboxEl,
  barSearchEngineURLInputEl,
  barSearchSuggestionsCheckboxEl
} from "~/src/options/scripts/ui";
import { syncColorInputControl } from "~/src/options/scripts/utils/color-inputs";
import {
  syncBarSearchBookmarksStorageHighlight,
  syncBarSearchBookmarksStorageHighlightScroll
} from "~/src/options/scripts/utils/bar-bookmarks-highlight";

export const syncBarSearchBookmarksStorageControls = (enabled: boolean): void => {
  barSearchBookmarksStorageSectionEl.classList.toggle("hidden", !enabled);
  barSearchBookmarksStorageSectionEl.classList.toggle("grid", enabled);
};

export const fillBarInputs = (config: Config): void => {
  barColorInputEl.value = config.bar.color;
  barSearchEngineURLInputEl.value = config.bar.searchEngineURL;
  barSearchSuggestionsCheckboxEl.checked = config.bar.search.suggestions;
  barSearchHistoryCheckboxEl.checked = config.bar.search.history;
  barSearchBookmarksCheckboxEl.checked = config.bar.search.bookmarks.enabled;
  barSearchBookmarksStorageTextareaEl.value = config.bar.search.bookmarks.storage;
  syncBarSearchBookmarksStorageControls(config.bar.search.bookmarks.enabled);
  syncBarSearchBookmarksStorageHighlight();
  syncBarSearchBookmarksStorageHighlightScroll();
  syncColorInputControl(barColorInputEl);
};