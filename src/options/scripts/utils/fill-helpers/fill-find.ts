import { type Config } from "~/src/utils/config";
import { findColorInputEl } from "~/src/options/scripts/ui";
import { syncColorInputControl } from "~/src/options/scripts/utils/color-inputs";

export const fillFindInputs = (config: Config): void => {
  findColorInputEl.value = config.find.color;
  syncColorInputControl(findColorInputEl);
};