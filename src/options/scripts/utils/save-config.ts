import {
  hotkeysHintsAvoidAdjacentPairsStatusEl,
  hotkeysMappingsStatusEl,
  rulesUrlsStatusEl
} from "~/src/options/scripts/ui";
import { hasEditorError } from "~/src/options/scripts/utils/editor-status";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
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

const hasUnresolvedEditorErrors = (): boolean =>
  hasEditorError(rulesUrlsStatusEl) ||
  hasEditorError(hotkeysMappingsStatusEl) ||
  hasEditorError(hotkeysHintsAvoidAdjacentPairsStatusEl);

export const saveConfigAndFastConfig = async (notify: boolean = true): Promise<Config> => {
  if (hasUnresolvedEditorErrors()) {
    if (notify) {
      getToastApi()?.error("config not saved", {
        description: "unresolved errors"
      });
    }

    return getConfig();
  }

  const draft = await getConfig();
  saveRulesSettingsToDraft(draft);
  saveHotkeysSettingsToDraft(draft);

  const config = deepMerge(structuredClone(defaultConfig), draft);
  await setConfigAndFastConfig(config);

  if (notify) {
    getToastApi()?.success("options saved");
  }

  return config;
};
