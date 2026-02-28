import { listenToInputs } from "~/src/options/scripts/inputs";
import { listenToKeys } from "~/src/options/scripts/keybinds";
import { createCollapseGroups } from "~/src/options/scripts/utils/collapse-option";
import { fillInputs } from "~/src/options/scripts/utils/fill-inputs";
import { getUserAgent } from "~/src/options/scripts/utils/user-agent";
import { getConfig } from "~/src/utils/config-storage";

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

(document.getElementById("version-number-text") as HTMLSpanElement).textContent += displayVersion;

(document.getElementById("user-agent-text") as HTMLSpanElement).textContent += getUserAgent();

void createCollapseGroups();

void getConfig().then((config) => {
  fillInputs(config);
});

listenToInputs();
listenToKeys();
