import { type Config } from "~/src/utils/config";
import { rulesUrlsTextareaEl } from "~/src/options/scripts/ui";

export const fillRulesInputs = (config: Config): void => {
  rulesUrlsTextareaEl.value = config.rules.urls;
};
