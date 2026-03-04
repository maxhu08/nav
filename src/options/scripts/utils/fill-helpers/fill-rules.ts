import { type Config } from "~/src/utils/config";
import {
  rulesUrlsBlacklistSectionEl,
  rulesUrlsBlacklistTextareaEl,
  rulesUrlsModeBlacklistButtonEl,
  rulesUrlsModeWhitelistButtonEl,
  rulesUrlsWhitelistSectionEl,
  rulesUrlsWhitelistTextareaEl
} from "~/src/options/scripts/ui";
import {
  syncRulesUrlsHighlight,
  syncRulesUrlsHighlightScroll
} from "~/src/options/scripts/utils/rules-highlight";

export const syncRulesUrlsModeControls = (mode: Config["rules"]["urls"]["mode"]): void => {
  const isWhitelist = mode === "whitelist";

  rulesUrlsModeBlacklistButtonEl.setAttribute("aria-pressed", String(!isWhitelist));
  rulesUrlsModeWhitelistButtonEl.setAttribute("aria-pressed", String(isWhitelist));
  rulesUrlsModeBlacklistButtonEl.classList.toggle("bg-yellow-500", !isWhitelist);
  rulesUrlsModeBlacklistButtonEl.classList.toggle("hover:bg-yellow-600", !isWhitelist);
  rulesUrlsModeBlacklistButtonEl.classList.toggle("bg-neutral-800", isWhitelist);
  rulesUrlsModeBlacklistButtonEl.classList.toggle("hover:bg-neutral-700", isWhitelist);
  rulesUrlsModeWhitelistButtonEl.classList.toggle("bg-yellow-500", isWhitelist);
  rulesUrlsModeWhitelistButtonEl.classList.toggle("hover:bg-yellow-600", isWhitelist);
  rulesUrlsModeWhitelistButtonEl.classList.toggle("bg-neutral-800", !isWhitelist);
  rulesUrlsModeWhitelistButtonEl.classList.toggle("hover:bg-neutral-700", !isWhitelist);
  rulesUrlsBlacklistSectionEl.classList.toggle("hidden", isWhitelist);
  rulesUrlsBlacklistSectionEl.classList.toggle("grid", !isWhitelist);
  rulesUrlsWhitelistSectionEl.classList.toggle("hidden", !isWhitelist);
  rulesUrlsWhitelistSectionEl.classList.toggle("grid", isWhitelist);
};

export const fillRulesInputs = (config: Config): void => {
  syncRulesUrlsModeControls(config.rules.urls.mode);
  rulesUrlsBlacklistTextareaEl.value = config.rules.urls.blacklist;
  rulesUrlsWhitelistTextareaEl.value = config.rules.urls.whitelist;
  syncRulesUrlsHighlight();
  syncRulesUrlsHighlightScroll();
};
