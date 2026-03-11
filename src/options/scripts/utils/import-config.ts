import { fillInputs } from "~/src/options/scripts/utils/fill-inputs";
import { showInputDialog } from "~/src/options/scripts/utils/input-dialog";
import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { defaultConfig } from "~/src/utils/config";
import { migrateOldConfig } from "~/src/utils/migrate-config";

const SAVE_PREFIX = "NAV_SAVE_FORMAT_";
const VERSIONED_SAVE_REGEX = /^NAV_SAVE_FORMAT_v[^_]+_(.+)$/;

export const importConfigAndSave = async (): Promise<void> => {
  const dataToImport = await showInputDialog(
    "input your save (THIS WILL OVERWRITE YOUR CURRENT CONFIG)"
  );

  if (dataToImport === null) {
    return;
  }

  if (dataToImport.trim() === "") {
    getToastApi()?.info("input was empty, nothing imported");
    return;
  }

  if (!dataToImport.startsWith(SAVE_PREFIX)) {
    getToastApi()?.error("incorrect save format, expected NAV_SAVE_FORMAT_v#.#.#_");
    return;
  }

  const versionedMatch = dataToImport.match(VERSIONED_SAVE_REGEX);
  if (!versionedMatch) {
    getToastApi()?.error("invalid save format");
    return;
  }

  let importedConfig: unknown;

  try {
    importedConfig = JSON.parse(versionedMatch[1].trim());
  } catch {
    getToastApi()?.error("invalid config data");
    return;
  }

  const mergedConfig = migrateOldConfig(importedConfig, defaultConfig);
  fillInputs(mergedConfig);
  await saveConfigAndFastConfig();
};
