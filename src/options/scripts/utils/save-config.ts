import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { updateConfig } from "~/src/utils/config";
import { saveHotkeysSettingsToDraft } from "~/src/options/scripts/utils/save-helpers/save-hotkeys";
export const saveConfig = (notify: boolean = true): void => {
  void updateConfig((draft) => {
    saveHotkeysSettingsToDraft(draft);
    return draft;
  }).then(() => {
    if (notify) {
      getToastApi()?.success("options saved");
    }
  });
};
