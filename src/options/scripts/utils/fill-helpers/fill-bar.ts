import { type Config } from "~/src/utils/config";
import { barColorInputEl, barSearchEngineURLInputEl } from "~/src/options/scripts/ui";
import { syncColorInputControl } from "~/src/options/scripts/utils/color-inputs";

export const fillBarInputs = (config: Config): void => {
  barColorInputEl.value = config.bar.color;
  barSearchEngineURLInputEl.value = config.bar.searchEngineURL;
  syncColorInputControl(barColorInputEl);
};