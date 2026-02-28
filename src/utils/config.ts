export type ActionName =
  | "show-hints-current-tab"
  | "show-hints-new-tab"
  | "yank-current-tab-url"
  | "scroll-down"
  | "scroll-half-page-down"
  | "scroll-half-page-up"
  | "scroll-left"
  | "scroll-right"
  | "scroll-up"
  | "scroll-to-bottom"
  | "scroll-to-top";

export type Config = {
  hotkeys: {
    mappings: string;
  };
};

export const DEFAULT_HOTKEY_MAPPINGS = [
  "d scroll-half-page-down",
  "f show-hints-current-tab",
  "h scroll-left",
  "j scroll-down",
  "k scroll-up",
  "l scroll-right",
  "u scroll-half-page-up",
  "F show-hints-new-tab",
  "yy yank-current-tab-url",
  "gg scroll-to-top",
  "G scroll-to-bottom"
].join("\n");

export const defaultConfig: Config = {
  hotkeys: {
    mappings: DEFAULT_HOTKEY_MAPPINGS
  }
};

const cloneDefaultConfig = (): Config => {
  return structuredClone(defaultConfig);
};

const mergeConfig = (value: unknown): Config => {
  const mergedConfig = cloneDefaultConfig();

  if (!value || typeof value !== "object") {
    return mergedConfig;
  }

  const candidateHotkeys = (
    value as {
      hotkeys?: unknown;
    }
  ).hotkeys;

  if (candidateHotkeys && typeof candidateHotkeys === "object") {
    const mappings = (
      candidateHotkeys as {
        mappings?: unknown;
      }
    ).mappings;

    if (typeof mappings === "string") {
      mergedConfig.hotkeys.mappings = mappings;
    }
  }

  return mergedConfig;
};

export const getConfig = (): Promise<Config> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["config"], (data) => {
      const config = mergeConfig(data.config);

      if (!data.config) {
        chrome.storage.local.set({ config }, () => resolve(config));
        return;
      }

      resolve(config);
    });
  });
};

export const setConfig = (config: Config): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ config: mergeConfig(config) }, () => resolve());
  });
};

export const updateConfig = async (updater: (draft: Config) => Config): Promise<Config> => {
  const nextConfig = updater(await getConfig());
  const mergedConfig = mergeConfig(nextConfig);

  await setConfig(mergedConfig);

  return mergedConfig;
};
