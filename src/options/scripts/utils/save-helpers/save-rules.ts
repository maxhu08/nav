import { type Config } from "~/src/utils/config";
import {
  rulesUrlsBlacklistTextareaEl,
  rulesUrlsModeWhitelistButtonEl,
  rulesUrlsWhitelistTextareaEl
} from "~/src/options/scripts/ui";

export const saveRulesSettingsToDraft = (draft: Config): void => {
  draft.rules.urls.mode =
    rulesUrlsModeWhitelistButtonEl.getAttribute("aria-pressed") === "true"
      ? "whitelist"
      : "blacklist";
  draft.rules.urls.blacklist = rulesUrlsBlacklistTextareaEl.value;
  draft.rules.urls.whitelist = rulesUrlsWhitelistTextareaEl.value;
};
