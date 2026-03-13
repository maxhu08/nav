import { injectStyles } from "~/src/core/utils/inject-styles";
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/isEditableTarget";
import { DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR } from "~/src/utils/config";
import { FOCUS_OVERLAY_ID, FOCUS_STYLE_ID } from "~/src/core/utils/get-ui";
import type { FindStyleRenderParams } from "~/src/core/styles/render-find-styles";

const FOCUS_OVERLAY_DURATION_MS = 1000;
const FOCUS_OVERLAY_HIDE_MS = 920;
const FOCUS_OVERLAY_FADE_OUT_MS = 220;

type FocusIndicatorController = {
  ensureOverlay: () => void;
  hideOverlay: () => void;
  scheduleOverlayPosition: () => void;
  handleFocusIndicatorEvent: (event: Event) => void;
  handleEditableBeforeInput: (event: Event) => void;
  syncStyles: () => void;
  setShowActivationIndicator: (value: boolean) => void;
  setActivationIndicatorColor: (value: string) => void;
  syncFindUIStyles: (
    root: ShadowRoot,
    findStyleId: string,
    findStyleParams: FindStyleRenderParams
  ) => void;
};

const colorParsingContext = document.createElement("canvas").getContext("2d");

const rgbStringToRgba = (value: string, alpha: number): string | null => {
  const matches = value.match(/\d*\.?\d+/g);

  if (!matches || matches.length < 3) {
    return null;
  }

  const [red, green, blue, sourceAlpha] = matches.map((match) => Number.parseFloat(match));
  const resolvedAlpha = Math.max(0, Math.min(1, (sourceAlpha ?? 1) * alpha));

  return `rgba(${red}, ${green}, ${blue}, ${resolvedAlpha})`;
};

const hexToRgba = (value: string, alpha: number): string | null => {
  const normalizedHex = value.toLowerCase();
  const expandedHex =
    normalizedHex.length === 4
      ? `#${normalizedHex[1]}${normalizedHex[1]}${normalizedHex[2]}${normalizedHex[2]}${normalizedHex[3]}${normalizedHex[3]}`
      : normalizedHex;

  if (!/^#[0-9a-f]{6}$/.test(expandedHex)) {
    return null;
  }

  const red = Number.parseInt(expandedHex.slice(1, 3), 16);
  const green = Number.parseInt(expandedHex.slice(3, 5), 16);
  const blue = Number.parseInt(expandedHex.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const colorToRgba = (color: string, alpha: number): string => {
  if (!colorParsingContext) {
    return `rgba(234, 179, 8, ${alpha})`;
  }

  colorParsingContext.fillStyle = "#000000";
  colorParsingContext.fillStyle = color;

  const normalized = colorParsingContext.fillStyle.toLowerCase();

  if (normalized.startsWith("#")) {
    return hexToRgba(normalized, alpha) ?? `rgba(234, 179, 8, ${alpha})`;
  }

  if (normalized.startsWith("rgb")) {
    return rgbStringToRgba(normalized, alpha) ?? `rgba(234, 179, 8, ${alpha})`;
  }

  return `rgba(234, 179, 8, ${alpha})`;
};

export const createFocusIndicatorController = (): FocusIndicatorController => {
  let focusedOverlayTarget: HTMLElement | null = null;
  let focusOverlayFrame: number | null = null;
  let focusOverlayTimeout: number | null = null;
  let showActivationIndicator = true;
  let activationIndicatorColor = DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR;

  const getFocusOverlay = (): HTMLDivElement => {
    const existing = document.getElementById(FOCUS_OVERLAY_ID);

    if (existing instanceof HTMLDivElement) {
      return existing;
    }

    const overlay = document.createElement("div");
    overlay.id = FOCUS_OVERLAY_ID;
    overlay.setAttribute("data-visible", "false");
    overlay.setAttribute("data-animate", "false");
    overlay.setAttribute("data-hiding", "false");
    document.documentElement.append(overlay);
    return overlay;
  };

  const getFocusStyleParams = () => ({
    overlayId: FOCUS_OVERLAY_ID,
    fadeOutMs: FOCUS_OVERLAY_FADE_OUT_MS,
    durationMs: FOCUS_OVERLAY_DURATION_MS,
    activationIndicatorColor,
    colorToRgba
  });

  const clearFocusOverlayFrame = (): void => {
    if (focusOverlayFrame === null) {
      return;
    }

    window.cancelAnimationFrame(focusOverlayFrame);
    focusOverlayFrame = null;
  };

  const clearFocusOverlayTimeout = (): void => {
    if (focusOverlayTimeout === null) {
      return;
    }

    window.clearTimeout(focusOverlayTimeout);
    focusOverlayTimeout = null;
  };

  const finishHidingFocusOverlay = (): void => {
    const overlay = getFocusOverlay();
    overlay.setAttribute("data-visible", "false");
    overlay.setAttribute("data-animate", "false");
    overlay.setAttribute("data-hiding", "false");
  };

  const hideFocusOverlay = (): void => {
    focusedOverlayTarget = null;
    clearFocusOverlayFrame();
    clearFocusOverlayTimeout();

    const overlay = getFocusOverlay();
    if (overlay.getAttribute("data-visible") !== "true") {
      finishHidingFocusOverlay();
      return;
    }

    overlay.setAttribute("data-animate", "false");
    overlay.setAttribute("data-hiding", "true");

    focusOverlayTimeout = window.setTimeout(() => {
      finishHidingFocusOverlay();
      focusOverlayTimeout = null;
    }, FOCUS_OVERLAY_FADE_OUT_MS);
  };

  const updateFocusOverlayPosition = (): void => {
    if (!focusedOverlayTarget || !focusedOverlayTarget.isConnected) {
      hideFocusOverlay();
      return;
    }

    const rect = focusedOverlayTarget.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      hideFocusOverlay();
      return;
    }

    const overlay = getFocusOverlay();
    const horizontalInset = 3;
    const verticalInset = 2;
    const targetHeight = rect.height + verticalInset * 2;
    const centeredTop = rect.top + rect.height / 2 - targetHeight / 2;

    overlay.style.top = `${Math.round(centeredTop)}px`;
    overlay.style.left = `${Math.round(rect.left - horizontalInset)}px`;
    overlay.style.width = `${Math.round(rect.width + horizontalInset * 2)}px`;
    overlay.style.height = `${Math.round(targetHeight)}px`;
    overlay.style.borderRadius = "0.375rem";
    overlay.style.boxShadow = `0 0 0 2px ${colorToRgba(activationIndicatorColor, 0.95)}`;
    overlay.setAttribute("data-hiding", "false");
    overlay.setAttribute("data-visible", "true");
  };

  const scheduleFocusOverlayPosition = (): void => {
    if (focusOverlayFrame !== null) {
      return;
    }

    focusOverlayFrame = window.requestAnimationFrame(() => {
      focusOverlayFrame = null;
      updateFocusOverlayPosition();
    });
  };

  const animateFocusOverlay = (): void => {
    const overlay = getFocusOverlay();
    overlay.setAttribute("data-animate", "false");
    overlay.setAttribute("data-visible", "true");

    void overlay.offsetWidth;

    overlay.setAttribute("data-animate", "true");
  };

  return {
    ensureOverlay: (): void => {
      getFocusOverlay();
    },
    hideOverlay: hideFocusOverlay,
    scheduleOverlayPosition: scheduleFocusOverlayPosition,
    handleFocusIndicatorEvent: (event: Event): void => {
      if (!showActivationIndicator) {
        return;
      }

      const target = (event as CustomEvent<{ element?: HTMLElement }>).detail?.element;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      focusedOverlayTarget = target;
      clearFocusOverlayTimeout();
      updateFocusOverlayPosition();
      animateFocusOverlay();

      focusOverlayTimeout = window.setTimeout(() => {
        hideFocusOverlay();
      }, FOCUS_OVERLAY_HIDE_MS);
    },
    handleEditableBeforeInput: (event: Event): void => {
      if (!isEditableTarget(event.target) && !isEditableTarget(getDeepActiveElement())) {
        return;
      }

      hideFocusOverlay();
    },
    syncStyles: (): void => {
      injectStyles({
        focusStyleId: FOCUS_STYLE_ID,
        focus: getFocusStyleParams()
      });
    },
    setShowActivationIndicator: (value: boolean): void => {
      showActivationIndicator = value;
    },
    setActivationIndicatorColor: (value: string): void => {
      activationIndicatorColor = value;
    },
    syncFindUIStyles: (
      root: ShadowRoot,
      findStyleId: string,
      findStyleParams: FindStyleRenderParams
    ): void => {
      injectStyles({
        focusStyleId: FOCUS_STYLE_ID,
        focus: getFocusStyleParams(),
        findStyleId,
        find: findStyleParams,
        findRoot: root
      });
    }
  };
};