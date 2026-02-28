import { type Config } from "~/src/utils/config";
import { fillHotkeysInputs } from "~/src/options/scripts/utils/fill-helpers/fill-hotkeys";

export const fillInputs = (config: Config): void => {
  fillHotkeysInputs(config);
};
