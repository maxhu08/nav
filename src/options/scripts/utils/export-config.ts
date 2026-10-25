import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { t } from "~/src/options/scripts/i18n";

export const saveAndExportConfig = async (): Promise<void> => {
  const config = await saveConfigAndFastConfig(false);
  const extensionVersion = chrome.runtime.getManifest().version;
  const formattedSave = `NAV_SAVE_FORMAT_v${extensionVersion}_${JSON.stringify(config)}`;

  try {
    await navigator.clipboard.writeText(formattedSave);
    getToastApi()?.success(t("config saved & copied to clipboard"));
  } catch {
    getToastApi()?.error(t("could not save config to clipboard"));
  }
};