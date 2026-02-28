import { fillInputs } from "~/src/options/scripts/utils/fill-inputs";
import { showActionDialog } from "~/src/options/scripts/utils/input-dialog";
import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { defaultConfig } from "~/src/utils/config";

export const setDefaultConfig = (): void => {
  void showActionDialog("do you want to reset your options to default? this cannot be undone.", {
    cancelText: "cancel",
    actionText: "reset",
    onAction: async () => {
      const clonedDefaultConfig = structuredClone(defaultConfig);
      fillInputs(clonedDefaultConfig);
      await saveConfigAndFastConfig(false);
      getToastApi()?.success("options reset to default");
    }
  }).then((confirmed) => {
    if (!confirmed) {
      getToastApi()?.info("you selected no, options did not reset");
    }
  });
};
