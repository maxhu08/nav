import { type Config } from "~/src/utils/config";
import { fillBarInputs } from "~/src/options/scripts/utils/fill-helpers/fill-bar";
import { fillFindInputs } from "~/src/options/scripts/utils/fill-helpers/fill-find";
import { fillHintsInputs } from "~/src/options/scripts/utils/fill-helpers/fill-hints";
import { fillHotkeysInputs } from "~/src/options/scripts/utils/fill-helpers/fill-hotkeys";
import { fillRulesInputs } from "~/src/options/scripts/utils/fill-helpers/fill-rules";

export const fillInputs = (config: Config): void => {
  fillRulesInputs(config);
  fillHotkeysInputs(config);
  fillBarInputs(config);
  fillFindInputs(config);
  fillHintsInputs(config);
};