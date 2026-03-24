import { setReservedHintPrefixes } from "~/src/core/actions/hints";
import { createFindModeController } from "~/src/core/actions/find-mode";
import { createWatchController } from "~/src/core/actions/watch-mode";
import { createStorageChangeHandler, syncFastConfig } from "~/src/core/utils/fast-config-sync";
import { createFocusIndicatorController } from "~/src/core/utils/focus-indicator";
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/is-editable-target";
import { createKeyState } from "~/src/core/utils/key-state";
import { subscribeToFrameActionMessages } from "~/src/core/utils/runtime-bridge";
import { ensureToastWrapper } from "~/src/core/utils/sonner";
import { createNavigationActions, createFindModeStylesBridge } from "~/src/core/navigation/actions";
import { isFrameActionMessage } from "~/src/core/navigation/frame-actions";
import { createForceNormalModeController } from "~/src/core/navigation/force-normal-mode";
import { registerRuntimeListeners } from "~/src/core/navigation/init-listeners";
import { createNavigationKeydownHandler } from "~/src/core/navigation/keydown";
import { createModeController } from "~/src/core/navigation/shared";
import { type FastConfig } from "~/src/utils/fast-config";

const IS_NAV_DEBUG_ENABLED = process.env.NAV_DEV === "true";

let isInitialized = false;
let shouldBypassNextTypingKeyAfterHintSelect = false;

const isOptionsPage = (): boolean => {
  const optionsUrl = chrome.runtime.getURL("options.html");
  return window.location.href === optionsUrl;
};

const modeController = createModeController();

const keyState = createKeyState({
  onReservedHintPrefixesChange: setReservedHintPrefixes,
  getMode: modeController.getMode
});

const focusIndicator = createFocusIndicatorController();

const findMode = createFindModeController({
  getMode: modeController.getMode,
  setMode: modeController.setMode,
  ...createFindModeStylesBridge(focusIndicator)
});

const watchController = createWatchController({
  isWatchMode: () => modeController.isMode("watch"),
  setMode: modeController.setMode,
  getActionSequence: keyState.getActionSequence
});

const { actions, installNavigationScrollTracking, isScrollAction } = createNavigationActions({
  findMode,
  setMode: modeController.setMode,
  watchController
});

const forceNormalMode = createForceNormalModeController({
  isOptionsPage,
  setMode: modeController.setMode,
  clearPendingState: keyState.clearPendingState,
  blurActiveEditableTarget: () => {
    const activeElement = getDeepActiveElement();
    if (!(activeElement instanceof HTMLElement) || !isEditableTarget(activeElement)) {
      return false;
    }

    activeElement.blur();
    return true;
  },
  isEditableTarget
});

const setForceNormalMode = (value: boolean): void => {
  forceNormalMode.setForceNormalMode(value);
};

const handleKeydown = createNavigationKeydownHandler({
  actions,
  findMode,
  forceNormalMode,
  isScrollAction,
  keyState,
  setShouldBypassNextTypingKeyAfterHintSelect: (value) => {
    shouldBypassNextTypingKeyAfterHintSelect = value;
  },
  shouldBypassNextTypingKeyAfterHintSelect: () => shouldBypassNextTypingKeyAfterHintSelect,
  watchController
});

const handleFrameActionMessage = (message: unknown): void => {
  if (!isFrameActionMessage(message)) {
    return;
  }

  void actions[message.actionName]();
};

const fastConfigSyncDeps = {
  applyHotkeyMappings: keyState.applyHotkeyMappings,
  applyUrlRules: (rules: FastConfig["rules"]["urls"]): void => {
    keyState.applyUrlRules(rules);
  },
  setForceNormalMode,
  setWatchShowCapitalizedLetters: watchController.setWatchShowCapitalizedLetters,
  setShowActivationIndicator: focusIndicator.setShowActivationIndicator,
  setActivationIndicatorColor: focusIndicator.setActivationIndicatorColor,
  syncFocusStyles: focusIndicator.syncStyles,
  syncWatchHintsOverlay: watchController.syncWatchHintsOverlay
};

export const initCoreNavigation = (): void => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;
  if (IS_NAV_DEBUG_ENABLED) {
    void import("~/src/core/debug/nav-debug").then(({ installNavDebugApi }) => {
      installNavDebugApi();
    });
  }

  installNavigationScrollTracking();

  if (!isOptionsPage()) {
    registerRuntimeListeners({
      focusIndicator: {
        syncStyles: focusIndicator.syncStyles,
        ensureOverlay: focusIndicator.ensureOverlay,
        handleFocusIndicatorEvent: focusIndicator.handleFocusIndicatorEvent as EventListener,
        handleEditableBeforeInput: focusIndicator.handleEditableBeforeInput,
        scheduleOverlayPosition: focusIndicator.scheduleOverlayPosition
      },
      findMode: {
        ensureFindUI: findMode.ensureFindUI,
        hideFindBar: findMode.hideFindBar
      },
      watchController: {
        syncWatchHintsOverlay: watchController.syncWatchHintsOverlay,
        handleWatchMediaStateChange: watchController.handleWatchMediaStateChange,
        handleWatchRouteChange: watchController.handleWatchRouteChange,
        handleWatchDomMutation: watchController.handleWatchDomMutation
      },
      setShouldBypassNextTypingKeyAfterHintSelect: (value): void => {
        shouldBypassNextTypingKeyAfterHintSelect = value;
      }
    });
  }

  ensureToastWrapper();
  syncFastConfig(fastConfigSyncDeps);
  chrome.storage.onChanged.addListener(createStorageChangeHandler(fastConfigSyncDeps));
  subscribeToFrameActionMessages(handleFrameActionMessage);
  window.addEventListener("keydown", handleKeydown, true);
};