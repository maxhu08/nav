import { deepMerge } from "~/src/utils/deep-merge";
import { DEFAULT_HINT_CHARSET, DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/hotkeys";

export const getConfig = (): Promise<Config> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["config"], (data) => {
      if (Object.keys(data).length === 0) {
        const config = structuredClone(defaultConfig);
        chrome.storage.local.set({ config }, () => resolve(config));
        return;
      }

      resolve(deepMerge(structuredClone(defaultConfig), data.config));
    });
  });
};

export const defaultConfig: Config = {
  rules: {
    urls: ""
  },
  hotkeys: {
    mappings: DEFAULT_HOTKEY_MAPPINGS,
    hints: {
      charset: DEFAULT_HINT_CHARSET,
      showActivationIndicator: true
    }
  }
};

export type Config = {
  rules: {
    urls: string;
  };
  hotkeys: {
    mappings: string;
    hints: {
      charset: string;
      showActivationIndicator: boolean;
    };
  };
};
