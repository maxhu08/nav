import { getExtensionNamespace } from "~/src/utils/extension-id";
import { DEFAULT_HINT_CHARSET } from "~/src/utils/hotkeys";
import {
  createEmptyReservedHintLabels,
  normalizeReservedHintLabels
} from "~/src/utils/hint-reserved-label-directives";
import { createHintActivator } from "~/src/core/actions/hints/activation";
import { createHintActivationCacheController } from "~/src/core/actions/hints/cache";
import {
  restoreRevealedHintControls,
  revealHoverHintControls
} from "~/src/core/utils/hints/hint-recognition";
import type { LinkMode } from "~/src/core/utils/hints/model";
import { applyHintFilter } from "~/src/core/utils/hints/input";
import { buildHintLabelIndex } from "~/src/core/utils/hints/label-index";
import { clearHintLabelPlanCache } from "~/src/core/utils/hints/labels";
import {
  createHintMarker,
  invalidateMarkerSize,
  setMarkerTypedState
} from "~/src/core/utils/hints/markers";
import {
  primeMarkerPositions,
  revealVideoHintControls,
  updateMarkerPositions
} from "~/src/core/utils/hints/layout";
import { assignHintLabels, collectHintTargets } from "~/src/core/utils/hints/pipeline";
import {
  applyHintStyles,
  createHintOverlay,
  getDefaultHintMarkerCSS
} from "~/src/core/utils/hints/renderer";
import type {
  AdjacentHintPairs,
  HintLabelPlanSettings,
  HintState,
  MarkerDomAttributes,
  ReservedHintLabels
} from "~/src/core/utils/hints/types";

const HINT_NAMESPACE_PREFIX = `nav-${getExtensionNamespace()}-`;
const OVERLAY_ID = `${HINT_NAMESPACE_PREFIX}link-hints-overlay`;
const MARKER_ATTRIBUTE = `data-${HINT_NAMESPACE_PREFIX}link-hint-marker`;
const LETTER_ATTRIBUTE = `data-${HINT_NAMESPACE_PREFIX}link-hint-marker-letter`;
const MARKER_STYLE_ATTRIBUTE = "data-nav-hint-marker";
const MARKER_VARIANT_STYLE_ATTRIBUTE = "data-nav-hint-marker-variant";
const LETTER_STYLE_ATTRIBUTE = "data-nav-hint-marker-letter";
const STYLE_ID = `${HINT_NAMESPACE_PREFIX}link-hints-style`;
const FOCUS_INDICATOR_EVENT = `${HINT_NAMESPACE_PREFIX}focus-indicator`;

export const HINT_SELECTABLE_ACTIVATED_EVENT = `${HINT_NAMESPACE_PREFIX}hint-selectable-activated`;

type HintsController = {
  activateHints: (
    mode: LinkMode,
    options?: { onActivate?: (element: HTMLElement) => void }
  ) => boolean;
  areHintsActive: () => boolean;
  areHintsPendingSelection: () => boolean;
  exitHints: () => void;
  handleHintsKeydown: (event: KeyboardEvent) => boolean;
  setAvoidedAdjacentHintPairs: (pairs: AdjacentHintPairs) => void;
  setHighlightThumbnails: (value: boolean) => void;
  setHintCharset: (charset: string) => void;
  setHintCSS: (value: string) => void;
  setMinHintLabelLength: (value: number) => void;
  setReservedHintLabels: (labels: ReservedHintLabels) => void;
  setReservedHintPrefixes: (prefixes: Iterable<string>) => void;
  setShowCapitalizedLetters: (value: boolean) => void;
};

export const createHintsController = (): HintsController => {
  let hintAlphabet = DEFAULT_HINT_CHARSET;
  let reservedHintPrefixes = new Set<string>();
  let avoidedAdjacentHintPairs: AdjacentHintPairs = {};
  let reservedHintLabels: ReservedHintLabels = createEmptyReservedHintLabels();
  let minHintLabelLength = 2;
  let showCapitalizedLetters = true;
  let highlightThumbnails = false;
  let hintCSS = "";

  const markerDomAttributes: MarkerDomAttributes = {
    markerAttribute: MARKER_ATTRIBUTE,
    markerStyleAttribute: MARKER_STYLE_ATTRIBUTE,
    markerVariantStyleAttribute: MARKER_VARIANT_STYLE_ATTRIBUTE,
    letterAttribute: LETTER_ATTRIBUTE,
    letterStyleAttribute: LETTER_STYLE_ATTRIBUTE
  };

  const hintState: HintState = {
    active: false,
    mode: "current-tab",
    typed: "",
    markers: [],
    visibleMarkers: [],
    labelIndex: null,
    overlay: null,
    onActivate: null,
    frameHandle: null,
    revealedHoverElements: []
  };

  const getLabelPlanSettings = (): HintLabelPlanSettings => ({
    minHintLabelLength,
    hintAlphabet,
    reservedHintPrefixes,
    avoidedAdjacentHintPairs
  });

  const { dispatchFocusIndicator, openHintInCurrentTab, openHintInNewTab } = createHintActivator({
    focusIndicatorEvent: FOCUS_INDICATOR_EVENT,
    selectableActivatedEvent: HINT_SELECTABLE_ACTIVATED_EVENT
  });

  const getHintActivationSettingsKey = (mode: LinkMode): string => {
    return JSON.stringify({
      avoidedAdjacentHintPairs,
      hintAlphabet,
      minHintLabelLength,
      mode,
      reservedHintLabels,
      reservedHintPrefixes: [...reservedHintPrefixes].sort(),
      showCapitalizedLetters
    });
  };

  const hintActivationCache = createHintActivationCacheController({
    getSettingsKey: getHintActivationSettingsKey
  });

  const initializeHintCSS = (): void => {
    if (hintCSS) {
      return;
    }

    hintCSS = getDefaultHintMarkerCSS(
      MARKER_STYLE_ATTRIBUTE,
      MARKER_VARIANT_STYLE_ATTRIBUTE,
      LETTER_STYLE_ATTRIBUTE
    );
  };

  const registerHintViewportListeners = (): void => {
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange, true);
    window.addEventListener("blur", exitHints, true);
  };

  const unregisterHintViewportListeners = (): void => {
    window.removeEventListener("scroll", onViewportChange, true);
    window.removeEventListener("resize", onViewportChange, true);
    window.removeEventListener("blur", exitHints, true);
  };

  const restoreCachedMarkers = (markers: HintState["markers"]): void => {
    for (const hint of markers) {
      if (!hint.visible) {
        hint.marker.style.display = "";
        hint.visible = true;
      }

      if (hint.renderedTyped.length > 0) {
        setMarkerTypedState(hint, "", markerDomAttributes);
      }
    }
  };

  const clearFrameHandle = (): void => {
    if (hintState.frameHandle === null) {
      return;
    }

    window.cancelAnimationFrame(hintState.frameHandle);
    hintState.frameHandle = null;
  };

  const schedulePositionUpdate = (): void => {
    if (!hintState.active || hintState.frameHandle !== null) {
      return;
    }

    hintState.frameHandle = window.requestAnimationFrame(() => {
      hintState.frameHandle = null;
      updateMarkerPositions(
        hintState.markers,
        hintState.mode,
        highlightThumbnails,
        MARKER_VARIANT_STYLE_ATTRIBUTE
      );
    });
  };

  const onViewportChange = (): void => {
    if (!hintState.active) {
      return;
    }

    schedulePositionUpdate();
  };

  const resetActiveHintState = (): void => {
    hintState.active = false;
    hintState.mode = "current-tab";
    hintState.typed = "";
    hintState.markers = [];
    hintState.visibleMarkers = [];
    hintState.labelIndex = null;
    hintState.overlay = null;
    hintState.onActivate = null;
  };

  const cleanupAfterFailedActivation = (): void => {
    hintActivationCache.withoutInvalidation(() => {
      restoreRevealedHintControls(hintState.revealedHoverElements);
    });
  };

  const setActiveHintSession = (
    mode: LinkMode,
    markers: HintState["markers"],
    overlay: HTMLDivElement,
    onActivate?: (element: HTMLElement) => void
  ): void => {
    hintState.active = true;
    hintState.mode = mode;
    hintState.typed = "";
    hintState.markers = markers;
    hintState.visibleMarkers = markers;
    hintState.labelIndex = buildHintLabelIndex(markers);
    hintState.overlay = overlay;
    hintState.onActivate = onActivate ?? null;
  };

  const primeActiveHintSession = (): void => {
    hintActivationCache.withoutInvalidation(() => {
      revealVideoHintControls(hintState.markers, hintState.revealedHoverElements);
    });
    primeMarkerPositions(
      hintState.markers,
      hintState.mode,
      highlightThumbnails,
      MARKER_VARIANT_STYLE_ATTRIBUTE
    );
    schedulePositionUpdate();
    registerHintViewportListeners();
  };

  const createFreshMarkers = (
    mode: LinkMode
  ): { markers: HintState["markers"]; overlay: HTMLDivElement } | null => {
    const elements = collectHintTargets(mode);
    if (elements.length === 0) {
      return null;
    }

    const labeledTargets = assignHintLabels(elements, reservedHintLabels, getLabelPlanSettings());
    const overlay = createHintOverlay(OVERLAY_ID, MARKER_ATTRIBUTE);
    const markers: HintState["markers"] = [];

    for (const target of labeledTargets) {
      const markerModel = createHintMarker(
        target.label,
        target.directive,
        mode,
        showCapitalizedLetters,
        markerDomAttributes
      );
      overlay.appendChild(markerModel.marker);
      markers.push({
        element: target.element,
        label: target.label,
        directive: target.directive,
        visible: true,
        ...markerModel
      });
    }

    return markers.length > 0 ? { markers, overlay } : null;
  };

  const cacheActiveHintSession = (): void => {
    if (!hintState.overlay || !hintState.labelIndex) {
      return;
    }

    hintActivationCache.set({
      labelIndex: hintState.labelIndex,
      markers: hintState.markers,
      mode: hintState.mode,
      overlay: hintState.overlay,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      settingsKey: getHintActivationSettingsKey(hintState.mode),
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth
    });
  };

  const activateHint = (hint: HintState["markers"][number]): void => {
    const mode = hintState.mode;
    const onActivate = hintState.onActivate;
    exitHints();

    if (mode === "new-tab") {
      openHintInNewTab(hint.element);
      return;
    }

    if (mode === "copy-link" || mode === "copy-image") {
      dispatchFocusIndicator(hint.element);
      onActivate?.(hint.element);
      return;
    }

    openHintInCurrentTab(hint.element);
  };

  const applyFilter = (): void => {
    if (!hintState.labelIndex) {
      return;
    }

    const result = applyHintFilter(
      hintState.typed,
      hintState.visibleMarkers,
      hintState.labelIndex,
      markerDomAttributes
    );
    hintState.visibleMarkers = result.visibleMarkers;

    const exactMatch = hintState.labelIndex.getExact(hintState.typed);
    if (exactMatch) {
      activateHint(exactMatch);
    }
  };

  const resetHintsAfterConfigChange = (clearLabelPlan = false): void => {
    if (clearLabelPlan) {
      clearHintLabelPlanCache();
    }

    hintActivationCache.invalidate();
    if (hintState.active) {
      exitHints();
    }
  };

  const syncMarkerLetterCase = (): void => {
    for (const hint of hintState.markers) {
      const isMatch = hintState.typed.length === 0 || hint.label.startsWith(hintState.typed);
      setMarkerTypedState(hint, isMatch ? hintState.typed : "", markerDomAttributes);

      const displayLabel = showCapitalizedLetters
        ? hint.label.toUpperCase()
        : hint.label.toLowerCase();

      for (let index = 0; index < hint.letters.length; index += 1) {
        const letter = hint.letters[index];
        if (!letter) {
          continue;
        }

        letter.textContent = displayLabel[index] ?? "";
      }

      invalidateMarkerSize(hint);
    }
  };

  const handleCharacterKey = (key: string): boolean => {
    const normalizedKey = key.toLowerCase();
    if (!hintAlphabet.includes(normalizedKey)) {
      const nextTyped = hintState.typed + normalizedKey;
      const canMatchReservedLabel = hintState.labelIndex?.hasPrefix(nextTyped) === true;
      if (!canMatchReservedLabel) {
        return true;
      }
    }

    hintState.typed += normalizedKey;
    applyFilter();
    return true;
  };

  const exitHints = (): void => {
    if (!hintState.active) {
      return;
    }

    clearFrameHandle();
    unregisterHintViewportListeners();
    hintActivationCache.withoutInvalidation(() => {
      restoreRevealedHintControls(hintState.revealedHoverElements);
      hintState.overlay?.remove();
    });
    resetActiveHintState();
  };

  const activateHints = (
    mode: LinkMode,
    options: { onActivate?: (element: HTMLElement) => void } = {}
  ): boolean => {
    exitHints();
    initializeHintCSS();
    applyHintStyles(STYLE_ID, hintCSS);
    hintActivationCache.ensureObserver();
    hintActivationCache.withoutInvalidation(() => {
      revealHoverHintControls(mode, hintState.revealedHoverElements);
    });

    const cachedActivation = hintActivationCache.getReusable(mode);
    if (cachedActivation) {
      restoreCachedMarkers(cachedActivation.markers);
      hintActivationCache.withoutInvalidation(() => {
        document.documentElement.appendChild(cachedActivation.overlay);
      });
      setActiveHintSession(
        mode,
        cachedActivation.markers,
        cachedActivation.overlay,
        options.onActivate
      );
      hintState.labelIndex = cachedActivation.labelIndex;
      primeActiveHintSession();
      return true;
    }

    const activation = createFreshMarkers(mode);
    if (!activation) {
      cleanupAfterFailedActivation();
      return false;
    }

    hintActivationCache.withoutInvalidation(() => {
      document.documentElement.appendChild(activation.overlay);
    });
    setActiveHintSession(mode, activation.markers, activation.overlay, options.onActivate);
    cacheActiveHintSession();
    primeActiveHintSession();
    return true;
  };

  return {
    activateHints,
    areHintsActive: (): boolean => hintState.active,
    areHintsPendingSelection: (): boolean => hintState.active && hintState.typed.length === 0,
    exitHints,
    handleHintsKeydown: (event: KeyboardEvent): boolean => {
      if (!hintState.active) {
        return false;
      }

      if (event.key === "Escape") {
        exitHints();
        return true;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        hintState.typed = hintState.typed.slice(0, -1);
        applyFilter();
        return true;
      }

      if (event.key === "Enter") {
        const exactMatch = hintState.labelIndex?.getExact(hintState.typed);
        if (exactMatch) {
          activateHint(exactMatch);
          return true;
        }

        if (hintState.visibleMarkers.length === 1) {
          activateHint(hintState.visibleMarkers[0]!);
        }
        return true;
      }

      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
        return true;
      }

      return handleCharacterKey(event.key);
    },
    setAvoidedAdjacentHintPairs: (pairs: AdjacentHintPairs): void => {
      avoidedAdjacentHintPairs = pairs;
      resetHintsAfterConfigChange(true);
    },
    setHighlightThumbnails: (value: boolean): void => {
      highlightThumbnails = value;
      hintActivationCache.invalidate();
      if (hintState.active) {
        schedulePositionUpdate();
      }
    },
    setHintCharset: (charset: string): void => {
      hintAlphabet = charset;
      resetHintsAfterConfigChange(true);
    },
    setHintCSS: (value: string): void => {
      hintCSS =
        value ||
        getDefaultHintMarkerCSS(
          MARKER_STYLE_ATTRIBUTE,
          MARKER_VARIANT_STYLE_ATTRIBUTE,
          LETTER_STYLE_ATTRIBUTE
        );
      applyHintStyles(STYLE_ID, hintCSS);
      hintActivationCache.invalidate();

      if (!hintState.active) {
        return;
      }

      for (const hint of hintState.markers) {
        invalidateMarkerSize(hint);
      }
      schedulePositionUpdate();
    },
    setMinHintLabelLength: (value: number): void => {
      minHintLabelLength = Number.isInteger(value) && value >= 1 ? value : 2;
      resetHintsAfterConfigChange(true);
    },
    setReservedHintLabels: (labels: ReservedHintLabels): void => {
      reservedHintLabels = normalizeReservedHintLabels(labels);
      resetHintsAfterConfigChange();
    },
    setReservedHintPrefixes: (prefixes: Iterable<string>): void => {
      reservedHintPrefixes = new Set(prefixes);
      resetHintsAfterConfigChange(true);
    },
    setShowCapitalizedLetters: (value: boolean): void => {
      showCapitalizedLetters = value;
      hintActivationCache.invalidate();
      if (!hintState.active) {
        return;
      }

      syncMarkerLetterCase();
      schedulePositionUpdate();
    }
  };
};