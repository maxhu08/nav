import { getManagedWebsiteRuleSnippet } from "~/src/popup/site-navigation-rule";
import { initCoreNavigation } from "~/src/core/navigation";
import { listenToInputs } from "~/src/options/scripts/inputs";
import { listenToKeys } from "~/src/options/scripts/keybinds";
import {
  hotkeysHintsAvoidAdjacentPairsContainerEl,
  hotkeysHintsAvoidAdjacentPairsTextareaEl,
  hotkeysMappingsContainerEl,
  hotkeysMappingsTextareaEl,
  rulesUrlsContainerEl,
  rulesUrlsTextareaEl
} from "~/src/options/scripts/ui";
import { createCollapseGroups } from "~/src/options/scripts/utils/collapse-option";
import { handleControls } from "~/src/options/scripts/utils/control-utils";
import { fillInputs } from "~/src/options/scripts/utils/fill-inputs";
import { initHotkeysHintsCustomCSSHighlight } from "~/src/options/scripts/utils/hints-custom-css-highlight";
import { showTextareaDialog } from "~/src/options/scripts/utils/input-dialog";
import {
  syncRulesUrlsHighlight,
  syncRulesUrlsHighlightScroll
} from "~/src/options/scripts/utils/rules-highlight";
import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { lockTextareaContainerHeight } from "~/src/options/scripts/utils/ui-helpers";
import { getUserAgent } from "~/src/options/scripts/utils/user-agent";
import { getConfig } from "~/src/utils/config";
import { getOptionsData, updateOptionsData } from "~/src/utils/options-storage";

const logo = document.getElementById("nav-logo") as HTMLImageElement;

logo.classList.add("animate-up-bouncy");

logo.addEventListener(
  "animationend",
  () => {
    logo.classList.replace("animate-up-bouncy", "animate-float");
  },
  {
    once: true
  }
);

const manifest = chrome.runtime.getManifest();
const displayVersion =
  document.documentElement.getAttribute("rc-version-info")?.trim() || manifest.version;

initCoreNavigation();

(document.getElementById("version-number-text") as HTMLSpanElement).textContent += displayVersion;

(document.getElementById("user-agent-text") as HTMLSpanElement).textContent += getUserAgent();

void createCollapseGroups();
initHotkeysHintsCustomCSSHighlight();

void getConfig().then((config) => {
  fillInputs(config);

  lockTextareaContainerHeight(rulesUrlsContainerEl, rulesUrlsTextareaEl);
  lockTextareaContainerHeight(hotkeysMappingsContainerEl, hotkeysMappingsTextareaEl);
  lockTextareaContainerHeight(
    hotkeysHintsAvoidAdjacentPairsContainerEl,
    hotkeysHintsAvoidAdjacentPairsTextareaEl
  );
});

listenToInputs();
listenToKeys();
handleControls();

let pendingExcludeSiteDialogPromise: Promise<void> | null = null;

const maybeShowPendingExcludeSiteDialog = async (): Promise<void> => {
  if (pendingExcludeSiteDialogPromise) {
    return pendingExcludeSiteDialogPromise;
  }

  pendingExcludeSiteDialogPromise = (async () => {
    const { pendingExcludeSiteUrl } = await getOptionsData();

    if (!pendingExcludeSiteUrl) {
      return;
    }

    await updateOptionsData((draft) => ({
      ...draft,
      pendingExcludeSiteUrl: null
    }));

    let url: URL;

    try {
      url = new URL(pendingExcludeSiteUrl);
    } catch {
      return;
    }

    if (!/^https?:$/.test(url.protocol)) {
      return;
    }

    const config = await getConfig();
    const snippet = await showTextareaDialog("Exclude site", {
      defaultValue: getManagedWebsiteRuleSnippet(config.rules.urls, url),
      note: "This will be added to rules.urls",
      confirmText: "add",
      cancelText: "cancel"
    });

    if (snippet === null) {
      return;
    }

    const normalizedSnippet = snippet.trim();

    if (!normalizedSnippet) {
      return;
    }

    rulesUrlsTextareaEl.value = [rulesUrlsTextareaEl.value.trimEnd(), normalizedSnippet]
      .filter(Boolean)
      .join("\n");
    syncRulesUrlsHighlight();
    syncRulesUrlsHighlightScroll();
    rulesUrlsContainerEl.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    rulesUrlsTextareaEl.focus();
    rulesUrlsTextareaEl.setSelectionRange(
      rulesUrlsTextareaEl.value.length,
      rulesUrlsTextareaEl.value.length
    );
    await saveConfigAndFastConfig();
  })();

  try {
    await pendingExcludeSiteDialogPromise;
  } finally {
    pendingExcludeSiteDialogPromise = null;
  }
};

void maybeShowPendingExcludeSiteDialog();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.optionsData) {
    return;
  }

  void maybeShowPendingExcludeSiteDialog();
});
