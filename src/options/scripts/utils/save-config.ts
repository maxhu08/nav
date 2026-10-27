import {
  barColorInputEl,
  barTabsColorInputEl,
  barWidthInputEl,
  barTextSizeInputEl,
  findWidthInputEl,
  findTextSizeInputEl,
  barSearchBookmarksCheckboxEl,
  barSearchBookmarksStorageStatusEl,
  barSearchBookmarksStorageTextareaEl,
  barSearchHistoryCheckboxEl,
  barSearchTabsCheckboxEl,
  barSearchEngineURLInputEl,
  barSearchSuggestionsCheckboxEl,
  findColorInputEl,
  hintsCharsetStatusEl,
  hintsCustomSelectorsStatusEl,
  hintsAvoidAdjacentPairsStatusEl,
  hintsReservedLabelsStatusEl,
  hotkeysMappingsStatusEl,
  rulesUrlsBlacklistStatusEl,
  rulesUrlsWhitelistStatusEl
} from "~/src/options/scripts/ui";
import { hasEditorError } from "~/src/options/scripts/utils/editor-status";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { saveHintsSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-hints";
import { saveHotkeysSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-hotkeys";
import { saveRulesSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-rules";
import { type Config, defaultConfig, getConfig } from "~/src/utils/config";
import { deepMerge } from "~/src/utils/deep-merge";
import { buildFastConfig } from "~/src/utils/fast-config";
import { t } from "~/src/options/scripts/i18n";
import {
  barStylingControls,
  findStylingControls
} from "~/src/options/scripts/utils/prompt-styling";

const setConfigAndFastConfig = (config: Config): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ config, fastConfig: buildFastConfig(config) }, () => resolve());
  });
};

const readPromptSize = (input: HTMLInputElement, fallback: number): number => {
  return Number.isFinite(input.valueAsNumber) && input.valueAsNumber > 0
    ? input.valueAsNumber
    : fallback;
};

const SAVE_ERROR_FIELDS = [
  { path: "rules.urls.blacklist", statusEl: rulesUrlsBlacklistStatusEl },
  { path: "rules.urls.whitelist", statusEl: rulesUrlsWhitelistStatusEl },
  { path: "hotkeys.mappings", statusEl: hotkeysMappingsStatusEl },
  { path: "bar.search.bookmarks.storage", statusEl: barSearchBookmarksStorageStatusEl },
  { path: "hints.charset", statusEl: hintsCharsetStatusEl },
  { path: "hints.directives", statusEl: hintsReservedLabelsStatusEl },
  { path: "hints.advanced.customSelectors", statusEl: hintsCustomSelectorsStatusEl },
  { path: "hints.avoidAdjacentPairs", statusEl: hintsAvoidAdjacentPairsStatusEl }
] as const;

const getFirstUnresolvedEditorErrorPath = (): string | null => {
  const errorField = SAVE_ERROR_FIELDS.find((field) => hasEditorError(field.statusEl));
  return errorField?.path ?? null;
};

export const saveConfigAndFastConfig = async (notify: boolean = true): Promise<Config> => {
  const unresolvedErrorPath = getFirstUnresolvedEditorErrorPath();

  if (unresolvedErrorPath) {
    if (notify) {
      getToastApi()?.error(
        t("{path} has unresolved errors; aborting save.", { path: unresolvedErrorPath })
      );
    }

    return getConfig();
  }

  const draft = await getConfig();
  saveRulesSettingsToDraft(draft);
  saveHotkeysSettingsToDraft(draft);
  barStylingControls.save(draft.bar);
  findStylingControls.save(draft.find);
  draft.bar.color = barColorInputEl.value;
  draft.bar.tabsColor = barTabsColorInputEl.value;
  draft.bar.width = readPromptSize(barWidthInputEl, defaultConfig.bar.width);
  draft.bar.textSize = readPromptSize(barTextSizeInputEl, defaultConfig.bar.textSize);
  draft.bar.searchEngineURL = barSearchEngineURLInputEl.value;
  draft.bar.search.suggestions = barSearchSuggestionsCheckboxEl.checked;
  draft.bar.search.history = barSearchHistoryCheckboxEl.checked;
  draft.bar.search.tabs = barSearchTabsCheckboxEl.checked;
  draft.bar.search.bookmarks.enabled = barSearchBookmarksCheckboxEl.checked;
  draft.bar.search.bookmarks.storage = barSearchBookmarksStorageTextareaEl.value;
  draft.find.color = findColorInputEl.value;
  draft.find.width = readPromptSize(findWidthInputEl, defaultConfig.find.width);
  draft.find.textSize = readPromptSize(findTextSizeInputEl, defaultConfig.find.textSize);
  saveHintsSettingsToDraft(draft);

  const config = deepMerge(structuredClone(defaultConfig), draft);
  await setConfigAndFastConfig(config);

  if (notify) {
    getToastApi()?.success(t("Changes saved."));
  }

  return config;
};