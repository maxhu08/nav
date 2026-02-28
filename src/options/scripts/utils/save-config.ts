import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { updateConfig } from "~/src/utils/config-storage";
import { saveHotkeysSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-hotkeys";
import { saveRulesSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-rules";

export const saveConfig = (notify: boolean = true): void => {
  void updateConfig((draft) => {
    saveRulesSettingsToDraft(draft);
    saveHotkeysSettingsToDraft(draft);

    return draft;
  }).then(() => {
    if (notify) {
      getToastApi()?.success("options saved");
    }
  });
};
