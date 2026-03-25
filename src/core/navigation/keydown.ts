import {
  areHintsActive,
  areHintsPendingSelection,
  exitHints,
  handleHintsKeydown
} from "~/src/core/actions/hints";
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/is-editable-target";
import { getKeyToken, isModifierKey } from "~/src/core/utils/key-state";
import { proxyActionToFrames } from "~/src/core/navigation/frame-actions";
import type { ActionHandler } from "~/src/core/navigation/shared";
import type { ActionName } from "~/src/utils/hotkeys";

type KeyStateDeps = {
  clearPendingCount: () => void;
  clearPendingState: () => void;
  getActionName: (keyToken: string) => {
    actionName: ActionName | null;
    claimKeydown: boolean;
    consumed: boolean;
  };
  getToggleHintsActionName: (keyToken: string) => {
    actionName: ActionName | null;
    claimKeydown: boolean;
    consumed: boolean;
  };
  getWatchActionName: (
    keyToken: string,
    actionSequences: Record<
      "toggle-fullscreen" | "toggle-play-pause" | "toggle-loop" | "toggle-mute" | "toggle-captions",
      string
    >
  ) => {
    actionName: ActionName | null;
    claimKeydown: boolean;
    consumed: boolean;
  };
  hasAllowedActionMappings: () => boolean;
  isActionAllowed: (actionName: ActionName) => boolean;
  resolveCount: () => number | undefined;
};

type KeydownHandlerDeps = {
  actions: Record<ActionName, ActionHandler>;
  findMode: {
    handleFindUIKeydown: (event: KeyboardEvent) => boolean;
    exitFindMode: () => void;
    isFindModeActive: () => boolean;
    shouldIgnoreKeydownInFindUI: (event: KeyboardEvent) => boolean;
  };
  forceNormalMode: {
    handleKeydownCapture: (event: KeyboardEvent) => void;
  };
  isScrollAction: (actionName: ActionName) => boolean;
  keyState: KeyStateDeps;
  onConsumeKeydown: (event: KeyboardEvent) => void;
  setShouldBypassNextTypingKeyAfterHintSelect: (value: boolean) => void;
  shouldBypassNextTypingKeyAfterHintSelect: () => boolean;
  watchController: {
    exitWatchMode: () => void;
    getWatchActionSequences: () => Record<
      "toggle-fullscreen" | "toggle-play-pause" | "toggle-loop" | "toggle-mute" | "toggle-captions",
      string
    >;
    isWatchModeActive: () => boolean;
    toggleFullscreen: () => boolean;
    toggleWatchCaptions: () => boolean;
    toggleWatchLoop: () => boolean;
    toggleWatchMute: () => boolean;
    toggleWatchPlayPause: () => boolean;
  };
};

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

export const createNavigationKeydownHandler = ({
  actions,
  findMode,
  forceNormalMode,
  isScrollAction,
  keyState,
  onConsumeKeydown,
  setShouldBypassNextTypingKeyAfterHintSelect,
  shouldBypassNextTypingKeyAfterHintSelect,
  watchController
}: KeydownHandlerDeps): ((event: KeyboardEvent) => void) => {
  const consumeKeydownEvent = (event: KeyboardEvent): void => {
    onConsumeKeydown(event);
    consumeKeyboardEvent(event);
  };

  const handleHintsModeKeydown = (event: KeyboardEvent): boolean => {
    if (!areHintsActive()) {
      return false;
    }

    if (areHintsPendingSelection()) {
      const keyToken = getKeyToken(event);
      if (keyToken) {
        const { actionName, claimKeydown, consumed } = keyState.getToggleHintsActionName(keyToken);
        if (actionName) {
          exitHints();
          consumeKeydownEvent(event);
          return true;
        }

        if (consumed) {
          if (claimKeydown) {
            consumeKeydownEvent(event);
          }
          return true;
        }
      }
    }

    if (handleHintsKeydown(event)) {
      consumeKeydownEvent(event);
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
      consumeKeydownEvent(event);
      return true;
    }

    if (findMode.isFindModeActive()) {
      findMode.exitFindMode();
      consumeKeydownEvent(event);
      return true;
    }

    if (blurActiveEditableTarget()) {
      keyState.clearPendingState();
      consumeKeydownEvent(event);
      return true;
    }

    return false;
  };

  const handleWatchModeKeydown = (event: KeyboardEvent, keyToken: string): boolean => {
    if (!watchController.isWatchModeActive()) {
      return false;
    }

    const { actionName, claimKeydown, consumed } = keyState.getWatchActionName(
      keyToken,
      watchController.getWatchActionSequences()
    );

    if (event.repeat && (actionName || claimKeydown)) {
      consumeKeydownEvent(event);
      return true;
    }

    if (actionName === "toggle-fullscreen" && watchController.toggleFullscreen()) {
      consumeKeydownEvent(event);
      return true;
    }
    if (actionName === "toggle-play-pause" && watchController.toggleWatchPlayPause()) {
      consumeKeydownEvent(event);
      return true;
    }
    if (actionName === "toggle-loop" && watchController.toggleWatchLoop()) {
      consumeKeydownEvent(event);
      return true;
    }
    if (actionName === "toggle-mute" && watchController.toggleWatchMute()) {
      consumeKeydownEvent(event);
      return true;
    }
    if (actionName === "toggle-captions" && watchController.toggleWatchCaptions()) {
      consumeKeydownEvent(event);
      return true;
    }
    if (consumed) {
      if (claimKeydown) {
        consumeKeydownEvent(event);
      }
      return true;
    }

    return false;
  };

  const handleActionKeydown = (event: KeyboardEvent, keyToken: string): void => {
    const { actionName, claimKeydown, consumed } = keyState.getActionName(keyToken);
    if (!actionName) {
      if (consumed && claimKeydown) {
        consumeKeydownEvent(event);
      }
      return;
    }

    if (!keyState.isActionAllowed(actionName)) {
      keyState.clearPendingCount();
      consumeKeydownEvent(event);
      return;
    }

    const didHandle = actions[actionName](keyState.resolveCount());
    if (!didHandle && proxyActionToFrames(actionName)) {
      consumeKeydownEvent(event);
      return;
    }

    if (!didHandle && !isScrollAction(actionName)) {
      return;
    }

    consumeKeydownEvent(event);
  };

  return (event: KeyboardEvent): void => {
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
      if (findMode.handleFindUIKeydown(event)) {
        consumeKeydownEvent(event);
        return;
      }

      if (handleEscapeModes(event)) {
        return;
      }

      setShouldBypassNextTypingKeyAfterHintSelect(false);
      if (areHintsActive()) {
        exitHints();
      }
      keyState.clearPendingState();
      return;
    }

    if (shouldBypassNextTypingKeyAfterHintSelect() && isLikelyTypingKey(event)) {
      setShouldBypassNextTypingKeyAfterHintSelect(false);
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
};