import { fillInputs } from "~/src/options/scripts/utils/fill-inputs";
import { showActionDialog } from "~/src/options/scripts/utils/input-dialog";
import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { defaultConfig } from "~/src/utils/config";
import { t } from "~/src/options/scripts/i18n";

export const setDefaultConfig = (): void => {
  void showActionDialog(t("Do you want to reset your options to default? This cannot be undone."), {
    cancelText: t("cancel"),
    actionText: t("reset"),
    onAction: async () => {
      const clonedDefaultConfig = structuredClone(defaultConfig);
      fillInputs(clonedDefaultConfig);
      await saveConfigAndFastConfig(false);
      getToastApi()?.success(t("Options reset to default."));
    }
  }).then((confirmed) => {
    if (!confirmed) {
      getToastApi()?.info(t("You selected no, options did not reset."));
    }
  });
};