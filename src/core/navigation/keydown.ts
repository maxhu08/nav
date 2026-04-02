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
    matchedSequence: string | null;
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
    matchedSequence: string | null;
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
    isFindInputFocused: () => boolean;
    isFindModeActive: () => boolean;
    shouldIgnoreKeydownInFindUI: (event: KeyboardEvent) => boolean;
  };
  hintController: {
    activateMode: (
      mode:
        | "current-tab"
        | "new-tab"
        | "right-click"
        | "yank-link-url"
        | "yank-image"
        | "yank-image-url",
      options?: { toggleKey?: string | null }
    ) => boolean;
    exitHintMode: () => void;
    handleHintKeydown: (event: KeyboardEvent) => boolean;
    isHintModeActive: () => boolean;
  };
  forceNormalMode: {
    isEnabled: () => boolean;
    handleKeydownCapture: (event: KeyboardEvent) => void;
  };
  isScrollAction: (actionName: ActionName) => boolean;
  keyState: KeyStateDeps;
  onConsumeKeydown: (event: KeyboardEvent) => void;
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

const isExtensionUiPage = (): boolean => {
  const optionsUrl = chrome.runtime.getURL("options.html");
  const docsUrl = chrome.runtime.getURL("docs.html");
  return window.location.href === optionsUrl || window.location.href === docsUrl;
};

const isExtensionEditableModeAction = (actionName: ActionName | null): boolean => {
  return (
    actionName === "find-mode" ||
    actionName === "bar-mode-current-tab" ||
    actionName === "bar-mode-new-tab" ||
    actionName === "bar-mode-edit-current-tab"
  );
};

const consumeKeyboardEvent = (event: KeyboardEvent): void => {
  event.preventDefault();
  event.stopImmediatePropagation();
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

const getHintToggleKey = (matchedSequence: string | null): string | null => {
  if (!matchedSequence) {
    return null;
  }

  const firstCharacter = Array.from(matchedSequence)[0] ?? null;
  if (!firstCharacter || firstCharacter === "<") {
    return null;
  }

  return firstCharacter.toLowerCase();
};

export const createNavigationKeydownHandler = ({
  actions,
  findMode,
  forceNormalMode,
  hintController,
  isScrollAction,
  keyState,
  onConsumeKeydown,
  watchController
}: KeydownHandlerDeps): ((event: KeyboardEvent) => void) => {
  const consumeKeydownEvent = (event: KeyboardEvent): void => {
    onConsumeKeydown(event);
    consumeKeyboardEvent(event);
  };

  const runAction = (actionName: ActionName, matchedSequence: string | null): boolean => {
    if (!keyState.isActionAllowed(actionName)) {
      keyState.clearPendingCount();
      return true;
    }

    const hintToggleKey = getHintToggleKey(matchedSequence);
    const didHandle =
      actionName === "hint-mode-current-tab"
        ? hintController.activateMode("current-tab", { toggleKey: hintToggleKey })
        : actionName === "hint-mode-new-tab"
          ? hintController.activateMode("new-tab", { toggleKey: hintToggleKey })
          : actionName === "hint-mode-right-click"
            ? hintController.activateMode("right-click", { toggleKey: hintToggleKey })
            : actionName === "yank-link-url"
              ? hintController.activateMode("yank-link-url", { toggleKey: hintToggleKey })
              : actionName === "yank-image"
                ? hintController.activateMode("yank-image", { toggleKey: hintToggleKey })
                : actionName === "yank-image-url"
                  ? hintController.activateMode("yank-image-url", { toggleKey: hintToggleKey })
                  : actions[actionName](keyState.resolveCount());

    if (!didHandle && proxyActionToFrames(actionName)) {
      return true;
    }

    if (!didHandle && !isScrollAction(actionName)) {
      return false;
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

    if (hintController.isHintModeActive()) {
      hintController.exitHintMode();
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
    const { actionName, claimKeydown, consumed, matchedSequence } =
      keyState.getActionName(keyToken);

    if (!actionName) {
      if (consumed && claimKeydown) {
        consumeKeydownEvent(event);
        return;
      }

      if (findMode.isFindModeActive()) {
        consumeKeydownEvent(event);
      }
      return;
    }

    if (!runAction(actionName, matchedSequence)) {
      if (findMode.isFindModeActive()) {
        consumeKeydownEvent(event);
      }
      return;
    }

    consumeKeydownEvent(event);
  };

  return (event: KeyboardEvent): void => {
    forceNormalMode.handleKeydownCapture(event);

    if (hintController.isHintModeActive()) {
      keyState.clearPendingState();

      hintController.handleHintKeydown(event);
      consumeKeydownEvent(event);
      return;
    }

    if (findMode.isFindModeActive() && findMode.isFindInputFocused()) {
      keyState.clearPendingState();

      if (findMode.handleFindUIKeydown(event)) {
        consumeKeydownEvent(event);
        return;
      }

      if (handleEscapeModes(event)) {
        return;
      }

      return;
    }

    if (!keyState.hasAllowedActionMappings()) {
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

      if (isExtensionUiPage()) {
        const keyToken = getKeyToken(event);

        if (keyToken) {
          const { actionName, claimKeydown, consumed, matchedSequence } =
            keyState.getActionName(keyToken);

          if (actionName && isExtensionEditableModeAction(actionName)) {
            if (runAction(actionName, matchedSequence)) {
              consumeKeydownEvent(event);
              return;
            }
          }

          if (consumed && claimKeydown) {
            consumeKeydownEvent(event);
            return;
          }
        }
      }

      keyState.clearPendingState();
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
      if (findMode.isFindModeActive()) {
        consumeKeydownEvent(event);
        return;
      }

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