import {
  setAvoidedAdjacentHintPairs,
  setHighlightThumbnails,
  setHintCSS,
  setHintCharset,
  setMinHintLabelLength,
  setPreferredSearchLabels,
  setShowCapitalizedLetters
} from "~/src/core/actions/hints";
import { type FastConfig, getFastConfig } from "~/src/utils/fast-config";
import { type HotkeyMappings } from "~/src/utils/hotkeys";

type FastConfigSyncDeps = {
  applyHotkeyMappings: (mappings: HotkeyMappings, prefixes: Partial<Record<string, true>>) => void;
  applyUrlRules: (rules: FastConfig["rules"]["urls"]) => void;
  setWatchShowCapitalizedLetters: (value: boolean) => void;
  setShowActivationIndicator: (value: boolean) => void;
  setActivationIndicatorColor: (value: string) => void;
  syncFocusStyles: () => void;
  syncWatchHintsOverlay: () => void;
};

const applyFastConfig = (fastConfig: FastConfig, deps: FastConfigSyncDeps): void => {
  deps.applyUrlRules(fastConfig.rules.urls);
  setHintCharset(fastConfig.hints.charset);
  setAvoidedAdjacentHintPairs(fastConfig.hints.avoidAdjacentPairs);
  setPreferredSearchLabels(fastConfig.hints.preferredSearchLabels);
  setMinHintLabelLength(fastConfig.hints.minLabelLength);
  setShowCapitalizedLetters(fastConfig.hints.showCapitalizedLetters);
  deps.setWatchShowCapitalizedLetters(fastConfig.hints.showCapitalizedLetters);
  setHighlightThumbnails(fastConfig.hints.improveThumbnailMarkers);
  setHintCSS(fastConfig.hints.css);
  deps.setShowActivationIndicator(fastConfig.hints.showActivationIndicator);
  deps.setActivationIndicatorColor(fastConfig.hints.showActivationIndicatorColor);
  deps.syncFocusStyles();
  deps.syncWatchHintsOverlay();
  deps.applyHotkeyMappings(fastConfig.hotkeys.mappings, fastConfig.hotkeys.prefixes);
};

export const syncFastConfig = (deps: FastConfigSyncDeps): void => {
  void getFastConfig().then((fastConfig) => {
    applyFastConfig(fastConfig, deps);
  });
};

export const createStorageChangeHandler =
  (deps: FastConfigSyncDeps) =>
  (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
    if (areaName !== "local" || !changes.fastConfig?.newValue) {
      return;
    }

    const nextFastConfig = changes.fastConfig.newValue as FastConfig;
    applyFastConfig(nextFastConfig, deps);
  };
