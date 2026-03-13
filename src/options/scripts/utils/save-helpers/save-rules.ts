import { type Config } from "~/src/utils/config";
import {
  rulesForceNormalModeCheckboxEl,
  rulesUrlsBlacklistTextareaEl,
  rulesUrlsModeWhitelistButtonEl,
  rulesUrlsWhitelistTextareaEl
} from "~/src/options/scripts/ui";

export const saveRulesSettingsToDraft = (draft: Config): void => {
  draft.rules.forceNormalMode = rulesForceNormalModeCheckboxEl.checked;
  draft.rules.urls.mode =
    rulesUrlsModeWhitelistButtonEl.getAttribute("aria-pressed") === "true"
      ? "whitelist"
      : "blacklist";
  draft.rules.urls.blacklist = rulesUrlsBlacklistTextareaEl.value;
  draft.rules.urls.whitelist = rulesUrlsWhitelistTextareaEl.value;
};