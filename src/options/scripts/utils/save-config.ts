import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { updateConfig } from "~/src/utils/config-storage";
import { saveHotkeysSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-hotkeys";
import { saveRulesSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-rules";
import { type Config } from "~/src/utils/config";

export const saveConfig = async (notify: boolean = true): Promise<Config> => {
  const config = await updateConfig((draft) => {
    saveRulesSettingsToDraft(draft);
    saveHotkeysSettingsToDraft(draft);

    return draft;
  });

  if (notify) {
    getToastApi()?.success("options saved");
  }

  return config;
};
