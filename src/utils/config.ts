import {
  DEFAULT_HINT_AVOID_ADJACENT_PAIRS,
  DEFAULT_HINT_CHARSET,
  DEFAULT_HINT_RESERVED_LABELS,
  DEFAULT_HOTKEY_MAPPINGS
} from "~/src/utils/hotkeys";
import { migrateOldConfig } from "~/src/utils/migrate-config";

export const DEFAULT_HINT_CUSTOM_CSS = `/* Hint marker styling */
:root {
  --nav-hint-marker-bg: #eab308;
  --nav-hint-marker-color: #2b1d00;
  --nav-hint-marker-pending-color: #000000;
  --nav-hint-marker-typed-color: #ffffff;
}

[data-nav-hint-marker] {
  transform: translate(-20%, -20%);
  transition: none !important;
  transition-duration: 0ms !important;
  transition-property: none !important;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--nav-hint-marker-bg);
  color: var(--nav-hint-marker-color);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
}

[data-nav-hint-marker-variant="thumbnail"] {
  transform: translate(0, 0);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.1;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
}

[data-nav-hint-marker-letter="pending"] {
  color: var(--nav-hint-marker-pending-color);
}

[data-nav-hint-marker-letter="typed"] {
  color: var(--nav-hint-marker-typed-color);
}
`;

export const DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR = "#eab308";

export const getConfig = (): Promise<Config> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["config"], (data) => {
      if (Object.keys(data).length === 0) {
        const config = structuredClone(defaultConfig);
        chrome.storage.local.set({ config }, () => resolve(config));
        return;
      }

      resolve(migrateOldConfig(data.config, defaultConfig));
    });
  });
};

export const defaultConfig: Config = {
  rules: {
    urls: {
      mode: "blacklist",
      blacklist: "",
      whitelist: ""
    }
  },
  hotkeys: {
    mappings: DEFAULT_HOTKEY_MAPPINGS
  },
  hints: {
    showCapitalizedLetters: false,
    improveThumbnailMarkers: true,
    minLabelLength: 2,
    showActivationIndicator: true,
    showActivationIndicatorColor: DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR,
    styling: "default",
    customCSS: DEFAULT_HINT_CUSTOM_CSS,
    charset: DEFAULT_HINT_CHARSET,
    avoidAdjacentPairs: DEFAULT_HINT_AVOID_ADJACENT_PAIRS,
    reservedLabels: DEFAULT_HINT_RESERVED_LABELS
  }
};

export type Config = {
  rules: {
    urls: {
      mode: "blacklist" | "whitelist";
      blacklist: string;
      whitelist: string;
    };
  };
  hotkeys: {
    mappings: string;
  };
  hints: {
    showCapitalizedLetters: boolean;
    improveThumbnailMarkers: boolean;
    minLabelLength: number;
    showActivationIndicator: boolean;
    showActivationIndicatorColor: string;
    styling: "default" | "custom";
    customCSS: string;
    charset: string;
    avoidAdjacentPairs: string;
    reservedLabels: string;
  };
};
