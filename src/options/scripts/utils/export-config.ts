import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { t } from "~/src/options/scripts/i18n";
import { showActionDialog } from "~/src/options/scripts/utils/input-dialog";

const exportConfig = async (copy = false): Promise<void> => {
  try {
    const config = await saveConfigAndFastConfig(false);
    const text = `NAV_SAVE_FORMAT_v${chrome.runtime.getManifest().version}_${JSON.stringify(config)}`;

    if (copy) {
      await navigator.clipboard.writeText(text);
      getToastApi()?.success(t("Config saved & copied to clipboard."));
    } else {
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "config.txt";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } catch {
    getToastApi()?.error(
      t(copy ? "Could not save config to clipboard." : "Could not export config.")
    );
  }
};

export const saveAndExportConfig = async (): Promise<void> => {
  if (document.getElementById("nav-action-dialog-overlay")) return;

  await showActionDialog(t("Export"), {
    variant: "export",
    actionText: t("download config"),
    onAction: () => exportConfig(),
    additionalAction: {
      text: t("copy to clipboard"),
      onAction: () => exportConfig(true)
    }
  });
};