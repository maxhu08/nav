import { type Config } from "~/src/utils/config";
import { fillHintsInputs } from "~/src/options/scripts/utils/fill-helpers/fill-hints";
import { fillHotkeysInputs } from "~/src/options/scripts/utils/fill-helpers/fill-hotkeys";
import { fillRulesInputs } from "~/src/options/scripts/utils/fill-helpers/fill-rules";

export const fillInputs = (config: Config): void => {
  fillRulesInputs(config);
  fillHotkeysInputs(config);
  fillHintsInputs(config);
};
