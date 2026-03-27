import type { isEditableTarget as isEditableTargetType } from "~/src/core/utils/is-editable-target";

type CoreMode = "normal" | "find" | "hint" | "watch";

type ForceNormalModeDeps = {
  isOptionsPage: () => boolean;
  setMode: (mode: CoreMode) => void;
  clearPendingState: () => void;
  blurActiveEditableTarget: () => boolean;
  isEditableTarget: typeof isEditableTargetType;
};

export const createForceNormalModeController = ({
  isOptionsPage,
  setMode,
  clearPendingState,
  blurActiveEditableTarget,
  isEditableTarget
}: ForceNormalModeDeps) => {
  let isEnabled = false;
  let isStartupGuardActive = false;
  let isGuardAttached = false;

  const deactivateStartupGuardFromUserEvent = (event: Event): void => {
    if (!event.isTrusted || !isEnabled) {
      return;
    }

    isStartupGuardActive = false;
  };

  const handleFocusIn = (event: FocusEvent): void => {
    if (!isEnabled || !isStartupGuardActive || !isEditableTarget(event.target)) {
      return;
    }

    if (blurActiveEditableTarget()) {
      setMode("normal");
      clearPendingState();
      return;
    }

    if (event.target instanceof HTMLElement) {
      event.target.blur();
      setMode("normal");
      clearPendingState();
    }
  };

  const attachGuard = (): void => {
    if (isGuardAttached) {
      return;
    }

    isGuardAttached = true;
    document.addEventListener("keydown", deactivateStartupGuardFromUserEvent, true);
    document.addEventListener("pointerdown", deactivateStartupGuardFromUserEvent, true);
    document.addEventListener("mousedown", deactivateStartupGuardFromUserEvent, true);
    document.addEventListener("touchstart", deactivateStartupGuardFromUserEvent, true);
    document.addEventListener("focusin", handleFocusIn, true);
  };

  const detachGuard = (): void => {
    if (!isGuardAttached) {
      return;
    }

    isGuardAttached = false;
    isStartupGuardActive = false;
    document.removeEventListener("keydown", deactivateStartupGuardFromUserEvent, true);
    document.removeEventListener("pointerdown", deactivateStartupGuardFromUserEvent, true);
    document.removeEventListener("mousedown", deactivateStartupGuardFromUserEvent, true);
    document.removeEventListener("touchstart", deactivateStartupGuardFromUserEvent, true);
    document.removeEventListener("focusin", handleFocusIn, true);
  };

  return {
    isEnabled: (): boolean => isEnabled,
    handleKeydownCapture: (event: KeyboardEvent): void => {
      if (event.isTrusted && isEnabled) {
        isStartupGuardActive = false;
      }
    },
    setForceNormalMode: (value: boolean): void => {
      isEnabled = value;

      if (isOptionsPage()) {
        return;
      }

      if (value) {
        isStartupGuardActive = true;
        setMode("normal");
        clearPendingState();
        blurActiveEditableTarget();
        attachGuard();
        return;
      }

      detachGuard();
    }
  };
};