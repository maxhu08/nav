import { type Config } from "~/src/utils/config";
import { rulesUrlsTextareaEl } from "~/src/options/scripts/ui";
import {
  syncRulesUrlsHighlight,
  syncRulesUrlsHighlightScroll
} from "~/src/options/scripts/utils/rules-highlight";

export const fillRulesInputs = (config: Config): void => {
  rulesUrlsTextareaEl.value = config.rules.urls;
  syncRulesUrlsHighlight();
  syncRulesUrlsHighlightScroll();
};
