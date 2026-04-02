import { type FastConfig, getFastConfig } from "~/src/utils/fast-config";
import { type HotkeyMappings } from "~/src/utils/hotkeys";

type FastConfigSyncDeps = {
  applyHotkeyMappings: (mappings: HotkeyMappings, prefixes: Partial<Record<string, true>>) => void;
  applyUrlRules: (rules: FastConfig["rules"]["urls"]) => void;
  setForceNormalMode: (value: boolean) => void;
  setHintShowCapitalizedLetters: (value: boolean) => void;
  setHintCharset: (value: string) => void;
  setHintCss: (value: string) => void;
  setHintMinLabelLength: (value: number) => void;
  setImproveThumbnailMarkers: (value: boolean) => void;
  setHintAvoidAdjacentPairs: (value: FastConfig["hints"]["avoidAdjacentPairs"]) => void;
  setHintDirectiveLabels: (value: FastConfig["hints"]["directives"]) => void;
  setWatchShowCapitalizedLetters: (value: boolean) => void;
  setShowActivationIndicator: (value: boolean) => void;
  setActivationIndicatorColor: (value: string) => void;
  syncFocusStyles: () => void;
  syncHintStyles: () => void;
  syncHintMarkers: () => void;
  syncWatchHintsOverlay: () => void;
};

const applyFastConfig = (fastConfig: FastConfig, deps: FastConfigSyncDeps): void => {
  deps.setForceNormalMode(fastConfig.rules.forceNormalMode);
  deps.applyUrlRules(fastConfig.rules.urls);
  deps.setHintShowCapitalizedLetters(fastConfig.hints.showCapitalizedLetters);
  deps.setHintCharset(fastConfig.hints.charset);
  deps.setHintCss(fastConfig.hints.css);
  deps.setHintMinLabelLength(fastConfig.hints.minLabelLength);
  deps.setImproveThumbnailMarkers(fastConfig.hints.improveThumbnailMarkers);
  deps.setHintAvoidAdjacentPairs(fastConfig.hints.avoidAdjacentPairs);
  deps.setHintDirectiveLabels(fastConfig.hints.directives);
  deps.setWatchShowCapitalizedLetters(fastConfig.hints.showCapitalizedLetters);
  deps.setShowActivationIndicator(fastConfig.hints.showActivationIndicator);
  deps.setActivationIndicatorColor(fastConfig.hints.showActivationIndicatorColor);
  deps.syncFocusStyles();
  deps.syncHintStyles();
  deps.syncHintMarkers();
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