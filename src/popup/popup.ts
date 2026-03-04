import { updateOptionsData } from "~/src/utils/options-storage";
import { getConfig } from "~/src/utils/config";

const logo = document.getElementById("nav-logo") as HTMLImageElement | null;

logo?.classList.add("animate-up-bouncy");

logo?.addEventListener(
  "animationend",
  () => {
    logo.classList.replace("animate-up-bouncy", "animate-float");
  },
  {
    once: true
  }
);

const openOptionsPage = (): void => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("options.html"));
  }
};

void getConfig().then((config) => {
  const excludeButtonLabelEl = document.querySelector("#exclude-button span");

  if (!excludeButtonLabelEl) {
    return;
  }

  excludeButtonLabelEl.textContent = config.rules.urls.mode === "whitelist" ? "include" : "exclude";
});

document.getElementById("options-button")?.addEventListener("click", () => {
  openOptionsPage();
});

document.getElementById("exclude-button")?.addEventListener("click", () => {
  void (async () => {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const url = activeTab?.url;

    await updateOptionsData((draft) => ({
      ...draft,
      pendingExcludeSiteUrl: typeof url === "string" ? url : null
    }));

    openOptionsPage();
  })();
});

export {};
