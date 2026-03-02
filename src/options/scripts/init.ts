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
import { lockTextareaContainerHeight } from "~/src/options/scripts/utils/ui-helpers";
import { getUserAgent } from "~/src/options/scripts/utils/user-agent";
import { getConfig } from "~/src/utils/config";

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
