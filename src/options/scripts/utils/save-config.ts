import {
  hotkeysHintsCharsetStatusEl,
  hotkeysHintsAvoidAdjacentPairsStatusEl,
  hotkeysHintsPreferredSearchLabelsStatusEl,
  hotkeysMappingsStatusEl,
  rulesUrlsStatusEl
} from "~/src/options/scripts/ui";
import { hasEditorError } from "~/src/options/scripts/utils/editor-status";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { saveHintsSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-hints";
import { saveHotkeysSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-hotkeys";
import { saveRulesSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-rules";
import { type Config, defaultConfig, getConfig } from "~/src/utils/config";
import { deepMerge } from "~/src/utils/deep-merge";
import { buildFastConfig } from "~/src/utils/fast-config";

const setConfigAndFastConfig = (config: Config): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ config, fastConfig: buildFastConfig(config) }, () => resolve());
  });
};

const SAVE_ERROR_FIELDS = [
  { path: "rules.urls", statusEl: rulesUrlsStatusEl },
  { path: "hotkeys.mappings", statusEl: hotkeysMappingsStatusEl },
  { path: "hints.charset", statusEl: hotkeysHintsCharsetStatusEl },
  { path: "hints.preferredSearchLabels", statusEl: hotkeysHintsPreferredSearchLabelsStatusEl },
  { path: "hints.avoidAdjacentPairs", statusEl: hotkeysHintsAvoidAdjacentPairsStatusEl }
] as const;

const getFirstUnresolvedEditorErrorPath = (): string | null => {
  const errorField = SAVE_ERROR_FIELDS.find(({ statusEl }) => hasEditorError(statusEl));
  return errorField?.path ?? null;
};

export const saveConfigAndFastConfig = async (notify: boolean = true): Promise<Config> => {
  const unresolvedErrorPath = getFirstUnresolvedEditorErrorPath();

  if (unresolvedErrorPath) {
    if (notify) {
      getToastApi()?.error(`${unresolvedErrorPath} has unresolved errors, aborting save`);
    }

    return getConfig();
  }

  const draft = await getConfig();
  saveRulesSettingsToDraft(draft);
  saveHotkeysSettingsToDraft(draft);
  saveHintsSettingsToDraft(draft);

  const config = deepMerge(structuredClone(defaultConfig), draft);
  await setConfigAndFastConfig(config);

  if (notify) {
    getToastApi()?.success("options saved");
  }

  return config;
};
