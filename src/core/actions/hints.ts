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

const schedulePositionUpdate = (): void => {
  if (!hintState.active || hintState.frameHandle !== null) return;

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
  if (!hintState.active) return;
  schedulePositionUpdate();
};

const clearFrameHandle = (): void => {
  if (hintState.frameHandle === null) return;
  window.cancelAnimationFrame(hintState.frameHandle);
  hintState.frameHandle = null;
};

export const exitHints = (): void => {
  if (!hintState.active) return;
  clearFrameHandle();
  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange, true);
  window.removeEventListener("blur", exitHints, true);
  hintActivationCache.withoutInvalidation(() => {
    restoreRevealedHintControls(hintState.revealedHoverElements);
    hintState.overlay?.remove();
  });

  hintState.active = false;
  hintState.mode = "current-tab";
  hintState.typed = "";
  hintState.markers = [];
  hintState.visibleMarkers = [];
  hintState.labelIndex = null;
  hintState.overlay = null;
  hintState.onActivate = null;
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

export const activateHints = (
  mode: LinkMode,
  options: {
    onActivate?: (element: HTMLElement) => void;
  } = {}
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

    hintState.active = true;
    hintState.mode = mode;
    hintState.typed = "";
    hintState.markers = cachedActivation.markers;
    hintState.visibleMarkers = cachedActivation.markers;
    hintState.labelIndex = cachedActivation.labelIndex;
    hintState.overlay = cachedActivation.overlay;
    hintState.onActivate = options.onActivate ?? null;

    hintActivationCache.withoutInvalidation(() => {
      revealVideoHintControls(cachedActivation.markers, hintState.revealedHoverElements);
    });
    primeMarkerPositions(
      cachedActivation.markers,
      hintState.mode,
      highlightThumbnails,
      MARKER_VARIANT_STYLE_ATTRIBUTE
    );
    schedulePositionUpdate();

    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange, true);
    window.addEventListener("blur", exitHints, true);

    return true;
  }

  const elements = collectHintTargets(mode);
  if (elements.length === 0) {
    hintActivationCache.withoutInvalidation(() => {
      restoreRevealedHintControls(hintState.revealedHoverElements);
    });
    return false;
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

  if (markers.length === 0) {
    hintActivationCache.withoutInvalidation(() => {
      restoreRevealedHintControls(hintState.revealedHoverElements);
    });
    return false;
  }
  hintActivationCache.withoutInvalidation(() => {
    document.documentElement.appendChild(overlay);
  });

  hintState.active = true;
  hintState.mode = mode;
  hintState.typed = "";
  hintState.markers = markers;
  hintState.visibleMarkers = markers;
  const labelIndex = buildHintLabelIndex(markers);
  hintState.labelIndex = labelIndex;
  hintState.overlay = overlay;
  hintState.onActivate = options.onActivate ?? null;
  hintActivationCache.set({
    labelIndex,
    markers,
    mode,
    overlay,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    settingsKey: getHintActivationSettingsKey(mode),
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth
  });
  hintActivationCache.withoutInvalidation(() => {
    revealVideoHintControls(markers, hintState.revealedHoverElements);
  });
  primeMarkerPositions(
    hintState.markers,
    hintState.mode,
    highlightThumbnails,
    MARKER_VARIANT_STYLE_ATTRIBUTE
  );
  schedulePositionUpdate();

  window.addEventListener("scroll", onViewportChange, true);
  window.addEventListener("resize", onViewportChange, true);
  window.addEventListener("blur", exitHints, true);

  return true;
};

export const areHintsActive = (): boolean => hintState.active;

export const areHintsPendingSelection = (): boolean =>
  hintState.active && hintState.typed.length === 0;

export const setHintCharset = (charset: string): void => {
  hintAlphabet = charset;
  clearHintLabelPlanCache();
  hintActivationCache.invalidate();

  if (hintState.active) {
    exitHints();
  }
};

export const setReservedHintPrefixes = (prefixes: Iterable<string>): void => {
  reservedHintPrefixes = new Set(prefixes);
  clearHintLabelPlanCache();
  hintActivationCache.invalidate();

  if (hintState.active) {
    exitHints();
  }
};

export const setAvoidedAdjacentHintPairs = (pairs: AdjacentHintPairs): void => {
  avoidedAdjacentHintPairs = pairs;
  clearHintLabelPlanCache();
  hintActivationCache.invalidate();

  if (hintState.active) {
    exitHints();
  }
};

export const setReservedHintLabels = (labels: ReservedHintLabels): void => {
  reservedHintLabels = normalizeReservedHintLabels(labels);
  hintActivationCache.invalidate();

  if (hintState.active) {
    exitHints();
  }
};

export const setMinHintLabelLength = (value: number): void => {
  minHintLabelLength = Number.isInteger(value) && value >= 1 ? value : 2;
  clearHintLabelPlanCache();
  hintActivationCache.invalidate();

  if (hintState.active) {
    exitHints();
  }
};

export const setShowCapitalizedLetters = (nextShowCapitalizedLetters: boolean): void => {
  showCapitalizedLetters = nextShowCapitalizedLetters;
  hintActivationCache.invalidate();

  if (!hintState.active) {
    return;
  }

  for (const hint of hintState.markers) {
    const isMatch = hintState.typed.length === 0 || hint.label.startsWith(hintState.typed);
    setMarkerTypedState(hint, isMatch ? hintState.typed : "", markerDomAttributes);

    const displayLabel = showCapitalizedLetters
      ? hint.label.toUpperCase()
      : hint.label.toLowerCase();

    for (let index = 0; index < hint.letters.length; index += 1) {
      const letter = hint.letters[index];
      if (!letter) continue;
      letter.textContent = displayLabel[index] ?? "";
    }

    invalidateMarkerSize(hint);
  }

  schedulePositionUpdate();
};

export const setHighlightThumbnails = (nextHighlightThumbnails: boolean): void => {
  highlightThumbnails = nextHighlightThumbnails;
  hintActivationCache.invalidate();

  if (hintState.active) {
    schedulePositionUpdate();
  }
};

export const setHintCSS = (nextHintCSS: string): void => {
  hintCSS =
    nextHintCSS ||
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
};

export const handleHintsKeydown = (event: KeyboardEvent): boolean => {
  if (!hintState.active) return false;

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
    const matches = hintState.visibleMarkers;
    const exactMatch = hintState.labelIndex?.getExact(hintState.typed);

    if (exactMatch) {
      activateHint(exactMatch);
      return true;
    }

    if (matches.length === 1) activateHint(matches[0]!);
    return true;
  }

  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
    return true;
  }

  const key = event.key.toLowerCase();
  if (!hintAlphabet.includes(key)) {
    const nextTyped = hintState.typed + key;
    const canMatchReservedLabel = hintState.labelIndex?.hasPrefix(nextTyped) === true;

    if (!canMatchReservedLabel) {
      return true;
    }
  }

  hintState.typed += key;
  applyFilter();
  return true;
};