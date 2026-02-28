import { saveConfig } from "~/src/options/scripts/utils/save-config";
export const listenToKeys = (): void => {
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveConfig();
    }
  });
};
