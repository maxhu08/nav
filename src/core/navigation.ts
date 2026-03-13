import {
  activateHints,
  areHintsActive,
  areHintsPendingSelection,
  exitHints,
  handleHintsKeydown,
  HINT_SELECTABLE_ACTIVATED_EVENT,
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
import { yankCurrentTabUrl, yankImage, yankImageUrl, yankLinkUrl } from "~/src/core/actions/yank";
import { createStorageChangeHandler, syncFastConfig } from "~/src/core/utils/fast-config-sync";
import { createFocusIndicatorController } from "~/src/core/utils/focus-indicator";
import {
  FIND_STYLE_ID,
  FOCUS_INDICATOR_EVENT,
  findStyleParams,
  getFindBar,
  getFindInput,
  isFindUIElement
} from "~/src/core/utils/get-ui";
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/is-editable-target";
import { createKeyState, getKeyToken, isModifierKey } from "~/src/core/utils/key-state";
import { ensureToastWrapper } from "~/src/core/utils/sonner";
import { getExtensionNamespace } from "~/src/utils/extension-id";
import { type FastConfig } from "~/src/utils/fast-config";
import { type ActionName } from "~/src/utils/hotkeys";

type ActionHandler = (count?: number) => boolean;
type CoreMode = "normal" | "find" | "watch";
const HINT_EXIT_KEY_GRACE_MS = 180;
const FRAME_ACTION_EVENT = `nav-${getExtensionNamespace()}-frame-action`;
const FRAME_ACTION_SOURCE = `nav-${getExtensionNamespace()}-frame-bridge`;
const MAX_FRAME_ACTION_HOPS = 6;

const FRAME_PROXY_ACTIONS = new Set<ActionName>([
  "watch-mode",
  "toggle-fullscreen",
  "toggle-play-pause",
  "toggle-loop",
  "toggle-mute",
  "toggle-captions"
]);

type FrameActionMessage = {
  source: string;
  type: string;
  actionName: ActionName;
  hops: number;
};

let currentMode: CoreMode = "normal";
let isInitialized = false;
let isForceNormalModeEnabled = false;
let isStartupFocusGuardActive = false;
let isForceNormalModeGuardAttached = false;
let hintExitGraceUntil = 0;
let shouldBypassNextTypingKeyAfterHintSelect = false;

const isTopFrame = (): boolean => {
  try {
    return window.top === window;
  } catch {
    return false;
  }
};

const isFrameActionMessage = (value: unknown): value is FrameActionMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<FrameActionMessage>;
  return (
    data.source === FRAME_ACTION_SOURCE &&
    data.type === FRAME_ACTION_EVENT &&
    typeof data.actionName === "string" &&
    FRAME_PROXY_ACTIONS.has(data.actionName as ActionName) &&
    typeof data.hops === "number"
  );
};

const postFrameActionToWindow = (target: Window, actionName: ActionName, hops: number): boolean => {
  try {
    target.postMessage(
      {
        source: FRAME_ACTION_SOURCE,
        type: FRAME_ACTION_EVENT,
        actionName,
        hops
      } satisfies FrameActionMessage,
      "*"
    );
    return true;
  } catch {
    return false;
  }
};

const broadcastFrameActionToChildren = (
  actionName: ActionName,
  hops: number,
  skipWindow: Window | null = null
): boolean => {
  if (hops >= MAX_FRAME_ACTION_HOPS) {
    return false;
  }

  let sent = false;
  for (let index = 0; index < window.frames.length; index += 1) {
    const childWindow = window.frames[index];
    if (!childWindow || childWindow === skipWindow) {
      continue;
    }

    if (postFrameActionToWindow(childWindow, actionName, hops + 1)) {
      sent = true;
    }
  }

  return sent;
};

const proxyActionToFrames = (actionName: ActionName): boolean => {
  if (!FRAME_PROXY_ACTIONS.has(actionName)) {
    return false;
  }

  let sent = broadcastFrameActionToChildren(actionName, 0);

  if (!isTopFrame()) {
    try {
      if (window.top && postFrameActionToWindow(window.top, actionName, 0)) {
        sent = true;
      }
    } catch {}
  }

  return sent;
};

const isMode = (mode: CoreMode): boolean => currentMode === mode;

const setMode = (mode: CoreMode): void => {
  currentMode = mode;
};

const getHintSelectableActivationDetail = (
  event: Event
): { didFocusImmediately: boolean } | null => {
  if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== "object") {
    return null;
  }

  const detail = event.detail as Partial<{ didFocusImmediately: unknown }>;
  if (typeof detail.didFocusImmediately !== "boolean") {
    return null;
  }

  return {
    didFocusImmediately: detail.didFocusImmediately
  };
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

  return event.composedPath().some((target) => isEditableTarget(target ?? null));
};

const blurActiveEditableTarget = (): boolean => {
  const activeElement = getDeepActiveElement();

  if (!(activeElement instanceof HTMLElement) || !isEditableTarget(activeElement)) {
    return false;
  }

  activeElement.blur();
  return true;
};

const deactivateStartupFocusGuardFromUserEvent = (event: Event): void => {
  if (!event.isTrusted || !isForceNormalModeEnabled) {
    return;
  }

  isStartupFocusGuardActive = false;
};

const handleForceNormalModeFocusIn = (event: FocusEvent): void => {
  if (!isForceNormalModeEnabled || !isStartupFocusGuardActive || !isEditableTarget(event.target)) {
    return;
  }

  if (blurActiveEditableTarget()) {
    setMode("normal");
    keyState.clearPendingState();
    return;
  }

  if (event.target instanceof HTMLElement) {
    event.target.blur();
    setMode("normal");
    keyState.clearPendingState();
  }
};

const attachForceNormalModeGuard = (): void => {
  if (isForceNormalModeGuardAttached) {
    return;
  }

  isForceNormalModeGuardAttached = true;
  document.addEventListener("keydown", deactivateStartupFocusGuardFromUserEvent, true);
  document.addEventListener("pointerdown", deactivateStartupFocusGuardFromUserEvent, true);
  document.addEventListener("mousedown", deactivateStartupFocusGuardFromUserEvent, true);
  document.addEventListener("touchstart", deactivateStartupFocusGuardFromUserEvent, true);
  document.addEventListener("focusin", handleForceNormalModeFocusIn, true);
};

const detachForceNormalModeGuard = (): void => {
  if (!isForceNormalModeGuardAttached) {
    return;
  }

  isForceNormalModeGuardAttached = false;
  isStartupFocusGuardActive = false;
  document.removeEventListener("keydown", deactivateStartupFocusGuardFromUserEvent, true);
  document.removeEventListener("pointerdown", deactivateStartupFocusGuardFromUserEvent, true);
  document.removeEventListener("mousedown", deactivateStartupFocusGuardFromUserEvent, true);
  document.removeEventListener("touchstart", deactivateStartupFocusGuardFromUserEvent, true);
  document.removeEventListener("focusin", handleForceNormalModeFocusIn, true);
};

const setForceNormalMode = (value: boolean): void => {
  isForceNormalModeEnabled = value;

  if (isOptionsPage()) {
    return;
  }

  if (value) {
    isStartupFocusGuardActive = true;
    setMode("normal");
    keyState.clearPendingState();
    blurActiveEditableTarget();
    attachForceNormalModeGuard();
    return;
  }

  detachForceNormalModeGuard();
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
        hintExitGraceUntil = performance.now() + HINT_EXIT_KEY_GRACE_MS;
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
    if (!areHintsActive() && event.key === "Escape") {
      hintExitGraceUntil = performance.now() + HINT_EXIT_KEY_GRACE_MS;
    }

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

const handleFrameActionMessage = (event: MessageEvent): void => {
  if (!isFrameActionMessage(event.data)) {
    return;
  }

  const { actionName, hops } = event.data;
  const didHandle = ACTIONS[actionName]();
  if (didHandle) {
    return;
  }

  if (hops >= MAX_FRAME_ACTION_HOPS) {
    return;
  }

  const sender = event.source instanceof Window ? event.source : null;
  broadcastFrameActionToChildren(actionName, hops, sender);
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.isTrusted && isForceNormalModeEnabled) {
    // Disable startup editable blur guard before handling actions.
    // Window capture keydown handlers run before document capture handlers,
    // so this prevents first-key races with hint-driven input focusing.
    isStartupFocusGuardActive = false;
  }

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

  if (performance.now() < hintExitGraceUntil && isLikelyTypingKey(event)) {
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
  installScrollTracking();
  const onOptionsPage = isOptionsPage();

  if (!onOptionsPage) {
    focusIndicator.syncStyles();
    focusIndicator.ensureOverlay();
    findMode.ensureFindUI();

    window.addEventListener(
      FOCUS_INDICATOR_EVENT,
      focusIndicator.handleFocusIndicatorEvent as EventListener,
      true
    );
    window.addEventListener("beforeinput", focusIndicator.handleEditableBeforeInput, true);
    window.addEventListener("compositionstart", focusIndicator.handleEditableBeforeInput, true);
    window.addEventListener("resize", focusIndicator.scheduleOverlayPosition, true);
    window.addEventListener("scroll", focusIndicator.scheduleOverlayPosition, true);
    window.addEventListener("resize", watchController.syncWatchHintsOverlay, true);
    window.addEventListener("scroll", watchController.syncWatchHintsOverlay, true);
    document.addEventListener("fullscreenchange", watchController.syncWatchHintsOverlay, true);
    document.addEventListener("play", watchController.handleWatchMediaStateChange, true);
    document.addEventListener("pause", watchController.handleWatchMediaStateChange, true);
    document.addEventListener("ended", watchController.handleWatchMediaStateChange, true);
    document.addEventListener("mousedown", (event) => {
      if (!isFindUIElement(event.target)) {
        findMode.hideFindBar();
      }
    });
    window.addEventListener(HINT_SELECTABLE_ACTIVATED_EVENT, (event) => {
      const detail = getHintSelectableActivationDetail(event);
      shouldBypassNextTypingKeyAfterHintSelect = !detail?.didFocusImmediately;
    });
    document.addEventListener("focusin", (event) => {
      if (isEditableTarget(event.target)) {
        shouldBypassNextTypingKeyAfterHintSelect = false;
      }
    });
  }

  ensureToastWrapper();
  syncFastConfig(fastConfigSyncDeps);
  chrome.storage.onChanged.addListener(handleStorageChange);
  window.addEventListener("message", handleFrameActionMessage);
  window.addEventListener("keydown", handleKeydown, true);
};