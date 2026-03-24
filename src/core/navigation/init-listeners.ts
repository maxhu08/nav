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
    handleWatchRouteChange: EventListener;
    handleWatchDomMutation: () => void;
  };
  setShouldBypassNextTypingKeyAfterHintSelect: (value: boolean) => void;
};

export const registerRuntimeListeners = ({
  focusIndicator,
  findMode,
  watchController,
  setShouldBypassNextTypingKeyAfterHintSelect
}: RuntimeListenerDeps): void => {
  let lastKnownLocationHref = window.location.href;
  const notifyRouteChangeIfNeeded = (eventName: string): void => {
    const nextLocationHref = window.location.href;
    if (nextLocationHref === lastKnownLocationHref) {
      return;
    }

    lastKnownLocationHref = nextLocationHref;
    watchController.handleWatchRouteChange(new Event(eventName));
  };

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
  window.addEventListener(
    "popstate",
    () => {
      lastKnownLocationHref = window.location.href;
      watchController.handleWatchRouteChange(new Event("popstate"));
    },
    true
  );
  window.addEventListener(
    "hashchange",
    () => {
      lastKnownLocationHref = window.location.href;
      watchController.handleWatchRouteChange(new Event("hashchange"));
    },
    true
  );
  document.addEventListener("fullscreenchange", watchController.syncWatchHintsOverlay, true);
  document.addEventListener("play", watchController.handleWatchMediaStateChange, true);
  document.addEventListener("pause", watchController.handleWatchMediaStateChange, true);
  document.addEventListener("ended", watchController.handleWatchMediaStateChange, true);

  try {
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      notifyRouteChangeIfNeeded("pushstate");
      return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      notifyRouteChangeIfNeeded("replacestate");
      return result;
    };
  } catch {
    // Firefox content scripts can reject overriding page history methods.
  }

  const watchDomObserver = new MutationObserver(() => {
    notifyRouteChangeIfNeeded("mutationroutechange");
    watchController.handleWatchDomMutation();
  });
  watchDomObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
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