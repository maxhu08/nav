import {
  activateHints,
  areHintsActive,
  areHintsPendingSelection,
  exitHints,
  handleHintsKeydown,
  setReservedHintPrefixes
} from "~/src/core/actions/hints";
import {
  installScrollTracking,
  scrollHalfPageDown,
  scrollHalfPageUp,
  scrollLeft,
  scrollRight,
  scrollDown,
  scrollToBottom,
  scrollToTop,
  scrollUp
} from "~/src/core/actions/scroll";
import { followNextPage, followPreviousPage } from "~/src/core/actions/navigation";
import { createEnableFindModeAction } from "~/src/core/actions/find";
import { createFindModeController } from "~/src/core/actions/find-mode";
import { createWatchController } from "~/src/core/actions/watch-mode";
import { goHistory, createTabCommandAction } from "~/src/core/actions/tabs";
import {
  yankCurrentTabUrl,
  yankCurrentTabUrlClean,
  yankImage,
  yankImageUrl,
  yankLinkUrl
} from "~/src/core/actions/yank";
import { createStorageChangeHandler, syncFastConfig } from "~/src/core/utils/fast-config-sync";
import { createFocusIndicatorController } from "~/src/core/utils/focus-indicator";
import {
  FIND_STYLE_ID,
  FOCUS_INDICATOR_EVENT,
  findStyleParams,
  getFindBar,
  getFindInput
} from "~/src/core/utils/get-ui";
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/is-editable-target";
import { createKeyState, getKeyToken, isModifierKey } from "~/src/core/utils/key-state";
import { subscribeToFrameActionMessages } from "~/src/core/utils/runtime-bridge";
import { ensureToastWrapper } from "~/src/core/utils/sonner";
import { isFrameActionMessage, proxyActionToFrames } from "~/src/core/navigation/frame-actions";
import { createForceNormalModeController } from "~/src/core/navigation/force-normal-mode";
import { registerRuntimeListeners } from "~/src/core/navigation/init-listeners";
import { type FastConfig } from "~/src/utils/fast-config";
import { type ActionName } from "~/src/utils/hotkeys";

type ActionHandler = (count?: number) => boolean;
type CoreMode = "normal" | "find" | "watch";
const IS_NAV_DEBUG_ENABLED = process.env.NAV_DEV === "true";

let currentMode: CoreMode = "normal";
let isInitialized = false;
let shouldBypassNextTypingKeyAfterHintSelect = false;

const isMode = (mode: CoreMode): boolean => currentMode === mode;

const setMode = (mode: CoreMode): void => {
  currentMode = mode;
};

const isOptionsPage = (): boolean => {
  const optionsUrl = chrome.runtime.getURL("options.html");
  return window.location.href === optionsUrl;
};

const keyState = createKeyState({
  onReservedHintPrefixesChange: setReservedHintPrefixes,
  getMode: () => currentMode
});

const focusIndicator = createFocusIndicatorController();

const findMode = createFindModeController({
  getMode: () => currentMode,
  setMode,
  onFocusIndicator: (element): void => {
    window.dispatchEvent(
      new CustomEvent(FOCUS_INDICATOR_EVENT, {
        detail: { element }
      })
    );
  },
  injectFindUIStyles: (root): void => {
    focusIndicator.syncFindUIStyles(root, FIND_STYLE_ID, findStyleParams);
  }
});

const watchController = createWatchController({
  isWatchMode: () => isMode("watch"),
  setMode: (mode): void => {
    setMode(mode);
  },
  getActionSequence: keyState.getActionSequence
});

const enableFindModeAction = createEnableFindModeAction({
  getFindBar,
  getFindInput,
  getFindQuery: findMode.getFindQuery,
  setFindQuery: findMode.setFindQuery,
  onEnable: () => {
    setMode("find");
  }
});

const createToggleHintsAction = (mode: "current-tab" | "new-tab"): ActionHandler => {
  return () => {
    if (areHintsPendingSelection()) {
      exitHints();
      return true;
    }

    return activateHints(mode);
  };
};

const ACTIONS: Record<ActionName, ActionHandler> = {
  "watch-mode": watchController.toggleVideoControls,
  "toggle-fullscreen": watchController.toggleFullscreen,
  "toggle-play-pause": watchController.togglePlayPause,
  "toggle-loop": watchController.toggleLoop,
  "toggle-mute": watchController.toggleMute,
  "toggle-captions": watchController.toggleCaptions,
  "find-mode": enableFindModeAction,
  "cycle-match-next": () => findMode.cycleFindMatch(1),
  "cycle-match-prev": () => findMode.cycleFindMatch(-1),
  "history-go-prev": (count = 1) => goHistory(-count),
  "history-go-next": (count = 1) => goHistory(count),
  "follow-prev": followPreviousPage,
  "follow-next": followNextPage,
  "tab-go-prev": createTabCommandAction("tab-go-prev"),
  "tab-go-next": createTabCommandAction("tab-go-next"),
  "duplicate-current-tab": createTabCommandAction("duplicate-current-tab"),
  "move-current-tab-to-new-window": createTabCommandAction("move-current-tab-to-new-window"),
  "close-current-tab": createTabCommandAction("close-current-tab"),
  "create-new-tab": createTabCommandAction("create-new-tab"),
  "reload-current-tab": createTabCommandAction("reload-current-tab"),
  "reload-current-tab-hard": createTabCommandAction("reload-current-tab-hard"),
  "hint-mode-current-tab": createToggleHintsAction("current-tab"),
  "hint-mode-new-tab": createToggleHintsAction("new-tab"),
  "yank-link-url": yankLinkUrl,
  "yank-image": yankImage,
  "yank-image-url": yankImageUrl,
  "yank-current-tab-url": yankCurrentTabUrl,
  "yank-current-tab-url-clean": yankCurrentTabUrlClean,
  "scroll-down": scrollDown,
  "scroll-half-page-down": scrollHalfPageDown,
  "scroll-half-page-up": scrollHalfPageUp,
  "scroll-left": scrollLeft,
  "scroll-right": scrollRight,
  "scroll-up": scrollUp,
  "scroll-to-bottom": scrollToBottom,
  "scroll-to-top": scrollToTop
};

const SCROLL_ACTIONS = new Set<ActionName>([
  "scroll-down",
  "scroll-half-page-down",
  "scroll-half-page-up",
  "scroll-left",
  "scroll-right",
  "scroll-up",
  "scroll-to-bottom",
  "scroll-to-top"
]);

const isScrollAction = (actionName: ActionName): boolean => SCROLL_ACTIONS.has(actionName);

const consumeKeyboardEvent = (event: KeyboardEvent): void => {
  event.preventDefault();
  event.stopImmediatePropagation();
};

const isLikelyTypingKey = (event: KeyboardEvent): boolean => {
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return false;
  }

  return event.key.length === 1 || event.key === " ";
};

const isKeydownFromEditableTarget = (event: KeyboardEvent): boolean => {
  if (isEditableTarget(event.target) || isEditableTarget(getDeepActiveElement())) {
    return true;
  }

  return event.composedPath().some((target) => isEditableTarget(target));
};

const blurActiveEditableTarget = (): boolean => {
  const activeElement = getDeepActiveElement();

  if (!(activeElement instanceof HTMLElement) || !isEditableTarget(activeElement)) {
    return false;
  }

  activeElement.blur();
  return true;
};

const forceNormalMode = createForceNormalModeController({
  isOptionsPage,
  setMode,
  clearPendingState: keyState.clearPendingState,
  blurActiveEditableTarget,
  isEditableTarget
});

const setForceNormalMode = (value: boolean): void => {
  forceNormalMode.setForceNormalMode(value);
};

const handleHintsModeKeydown = (event: KeyboardEvent): boolean => {
  if (!areHintsActive()) {
    return false;
  }

  if (areHintsPendingSelection()) {
    const keyToken = getKeyToken(event);

    if (keyToken) {
      const { actionName, consumed } = keyState.getToggleHintsActionName(keyToken);

      if (actionName) {
        exitHints();
        consumeKeyboardEvent(event);
        return true;
      }

      if (consumed) {
        consumeKeyboardEvent(event);
        return true;
      }
    }
  }

  if (handleHintsKeydown(event)) {
    consumeKeyboardEvent(event);
  }

  return true;
};

const handleEscapeModes = (event: KeyboardEvent): boolean => {
  if (event.key !== "Escape") {
    return false;
  }

  if (watchController.isWatchModeActive()) {
    watchController.exitWatchMode();
    keyState.clearPendingState();
    consumeKeyboardEvent(event);
    return true;
  }

  if (findMode.isFindModeActive()) {
    findMode.exitFindMode();
    consumeKeyboardEvent(event);
    return true;
  }

  if (blurActiveEditableTarget()) {
    keyState.clearPendingState();
    consumeKeyboardEvent(event);
    return true;
  }

  return false;
};

const handleWatchModeKeydown = (event: KeyboardEvent, keyToken: string): boolean => {
  if (!watchController.isWatchModeActive()) {
    return false;
  }

  const { actionName, consumed } = keyState.getWatchActionName(
    keyToken,
    watchController.getWatchActionSequences()
  );

  if (event.repeat && (actionName || consumed)) {
    consumeKeyboardEvent(event);
    return true;
  }

  if (actionName === "toggle-fullscreen" && watchController.toggleFullscreen()) {
    consumeKeyboardEvent(event);
    return true;
  }

  if (actionName === "toggle-play-pause" && watchController.toggleWatchPlayPause()) {
    consumeKeyboardEvent(event);
    return true;
  }

  if (actionName === "toggle-loop" && watchController.toggleWatchLoop()) {
    consumeKeyboardEvent(event);
    return true;
  }

  if (actionName === "toggle-mute" && watchController.toggleWatchMute()) {
    consumeKeyboardEvent(event);
    return true;
  }

  if (actionName === "toggle-captions" && watchController.toggleWatchCaptions()) {
    consumeKeyboardEvent(event);
    return true;
  }

  if (consumed) {
    consumeKeyboardEvent(event);
    return true;
  }

  return false;
};

const handleActionKeydown = (event: KeyboardEvent, keyToken: string): void => {
  const { actionName, consumed } = keyState.getActionName(keyToken);

  if (!actionName) {
    if (consumed) {
      consumeKeyboardEvent(event);
    }

    return;
  }

  if (!keyState.isActionAllowed(actionName)) {
    keyState.clearPendingCount();
    consumeKeyboardEvent(event);
    return;
  }

  const didHandle = ACTIONS[actionName](keyState.resolveCount());

  if (!didHandle && proxyActionToFrames(actionName)) {
    consumeKeyboardEvent(event);
    return;
  }

  if (!didHandle && !isScrollAction(actionName)) {
    return;
  }

  consumeKeyboardEvent(event);
};

const handleFrameActionMessage = (message: unknown): void => {
  if (!isFrameActionMessage(message)) {
    return;
  }

  const { actionName } = message;
  const didHandle = ACTIONS[actionName]();
  void didHandle;
};

const handleKeydown = (event: KeyboardEvent): void => {
  forceNormalMode.handleKeydownCapture(event);

  if (!keyState.hasAllowedActionMappings()) {
    if (areHintsActive()) {
      exitHints();
    }

    if (watchController.isWatchModeActive()) {
      watchController.exitWatchMode();
    }

    if (findMode.isFindModeActive()) {
      findMode.exitFindMode();
    }

    keyState.clearPendingState();
    return;
  }

  if (isKeydownFromEditableTarget(event)) {
    if (handleEscapeModes(event)) {
      return;
    }

    shouldBypassNextTypingKeyAfterHintSelect = false;

    if (areHintsActive()) {
      exitHints();
    }

    keyState.clearPendingState();
    return;
  }

  if (shouldBypassNextTypingKeyAfterHintSelect && isLikelyTypingKey(event)) {
    shouldBypassNextTypingKeyAfterHintSelect = false;
    keyState.clearPendingState();
    return;
  }

  if (handleHintsModeKeydown(event)) {
    return;
  }

  if (handleEscapeModes(event)) {
    return;
  }

  if (findMode.shouldIgnoreKeydownInFindUI(event)) {
    keyState.clearPendingState();
    return;
  }

  const keyToken = getKeyToken(event);
  if (!keyToken) {
    if (!isModifierKey(event.key)) {
      keyState.clearPendingState();
    }

    return;
  }

  if (handleWatchModeKeydown(event, keyToken)) {
    return;
  }

  handleActionKeydown(event, keyToken);
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

const handleStorageChange = createStorageChangeHandler(fastConfigSyncDeps);

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
  installScrollTracking();
  const onOptionsPage = isOptionsPage();

  if (!onOptionsPage) {
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
        handleWatchMediaStateChange: watchController.handleWatchMediaStateChange
      },
      setShouldBypassNextTypingKeyAfterHintSelect: (value): void => {
        shouldBypassNextTypingKeyAfterHintSelect = value;
      }
    });
  }

  ensureToastWrapper();
  syncFastConfig(fastConfigSyncDeps);
  chrome.storage.onChanged.addListener(handleStorageChange);
  subscribeToFrameActionMessages(handleFrameActionMessage);
  window.addEventListener("keydown", handleKeydown, true);
};