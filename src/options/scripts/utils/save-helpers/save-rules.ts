import { type Config } from "~/src/utils/config";
import { rulesUrlsTextareaEl } from "~/src/options/scripts/ui";

export const saveRulesSettingsToDraft = (draft: Config): void => {
  draft.rules.urls = rulesUrlsTextareaEl.value;
};
