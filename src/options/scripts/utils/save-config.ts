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

export const saveConfigAndFastConfig = async (notify: boolean = true): Promise<Config> => {
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
