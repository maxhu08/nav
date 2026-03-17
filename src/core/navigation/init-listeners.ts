import { HINT_SELECTABLE_ACTIVATED_EVENT } from "~/src/core/actions/hints";
import { FOCUS_INDICATOR_EVENT, isFindUIElement } from "~/src/core/utils/get-ui";
import { isEditableTarget } from "~/src/core/utils/is-editable-target";

export const getHintSelectableActivationDetail = (
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

type RuntimeListenerDeps = {
  focusIndicator: {
    syncStyles: () => void;
    ensureOverlay: () => void;
    handleFocusIndicatorEvent: EventListener;
    handleEditableBeforeInput: EventListener;
    scheduleOverlayPosition: EventListener;
  };
  findMode: {
    ensureFindUI: () => void;
    hideFindBar: () => void;
  };
  watchController: {
    syncWatchHintsOverlay: EventListener;
    handleWatchMediaStateChange: EventListener;
  };
  setShouldBypassNextTypingKeyAfterHintSelect: (value: boolean) => void;
};

export const registerRuntimeListeners = ({
  focusIndicator,
  findMode,
  watchController,
  setShouldBypassNextTypingKeyAfterHintSelect
}: RuntimeListenerDeps): void => {
  focusIndicator.syncStyles();
  focusIndicator.ensureOverlay();
  findMode.ensureFindUI();

  window.addEventListener(FOCUS_INDICATOR_EVENT, focusIndicator.handleFocusIndicatorEvent, true);
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
    setShouldBypassNextTypingKeyAfterHintSelect(!detail?.didFocusImmediately);
  });
  document.addEventListener("focusin", (event) => {
    if (isEditableTarget(event.target)) {
      setShouldBypassNextTypingKeyAfterHintSelect(false);
    }
  });
};