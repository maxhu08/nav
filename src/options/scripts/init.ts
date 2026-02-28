import { getUserAgent } from "~/src/options/scripts/utils/user-agent";

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
