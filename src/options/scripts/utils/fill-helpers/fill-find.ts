import { type Config } from "~/src/utils/config";
import { findColorInputEl, findWidthInputEl, findTextSizeInputEl } from "~/src/options/scripts/ui";
import { syncColorInputControl } from "~/src/options/scripts/utils/color-inputs";
import { findStylingControls } from "~/src/options/scripts/utils/prompt-styling";

export const fillFindInputs = (config: Config): void => {
  findStylingControls.fill(config.find);
  findColorInputEl.value = config.find.color;
  findWidthInputEl.value = config.find.width.toString();
  findTextSizeInputEl.value = config.find.textSize.toString();
  syncColorInputControl(findColorInputEl);
};