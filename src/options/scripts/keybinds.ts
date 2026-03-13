import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { saveAndExportConfig } from "~/src/options/scripts/utils/export-config";
import { importConfigAndSave } from "~/src/options/scripts/utils/import-config";

export const listenToKeys = (): void => {
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void saveConfigAndFastConfig();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
      event.preventDefault();
      void saveAndExportConfig();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      void importConfigAndSave();
    }
  });
};