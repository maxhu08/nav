import { DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/hotkeys";

export const defaultConfig: Config = {
  rules: {
    urls: ""
  },
  hotkeys: {
    mappings: DEFAULT_HOTKEY_MAPPINGS
  }
};

export type Config = {
  rules: {
    urls: string;
  };
  hotkeys: {
    mappings: string;
  };
};
