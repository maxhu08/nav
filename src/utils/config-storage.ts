import { type Config, defaultConfig } from "~/src/utils/config";
import { deepMerge } from "~/src/utils/deep-merge";

const mergeConfig = (value: unknown): Config => {
  return deepMerge(structuredClone(defaultConfig), value);
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
