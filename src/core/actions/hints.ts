import { getExtensionNamespace } from "~/src/utils/extension-id";
import { DEFAULT_HINT_CHARSET } from "~/src/utils/hotkeys";
import {
  getDeepActiveElement,
  isEditableElement,
  isSelectableElement
} from "~/src/core/utils/is-editable-target";
import {
  restoreRevealedHintControls,
  revealHoverHintControls
} from "~/src/core/utils/hints/hint-recognition";
import type { LinkMode } from "~/src/core/utils/hints/hint-recognition";
import { applyHintFilter } from "~/src/core/utils/hints/input";
import { buildHintLabelIndex } from "~/src/core/utils/hints/label-index";
import { clearHintLabelPlanCache } from "~/src/core/utils/hints/labels";
import {
  createHintMarker,
  invalidateMarkerSize,
  setMarkerTypedState
} from "~/src/core/utils/hints/markers";
import { revealVideoHintControls, updateMarkerPositions } from "~/src/core/utils/hints/layout";
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
const IS_MAC = navigator.userAgent.includes("Mac");
const BLURRING_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit"
]);

let hintAlphabet = DEFAULT_HINT_CHARSET;
let reservedHintPrefixes = new Set<string>();
let avoidedAdjacentHintPairs: AdjacentHintPairs = {};
let reservedHintLabels: ReservedHintLabels = {
  input: [],
  attach: [],
  home: [],
  sidebar: [],
  next: [],
  prev: [],
  cancel: [],
  submit: [],
  like: [],
  dislike: []
};
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

const shouldBlurAfterActivation = (element: HTMLElement): boolean =>
  element instanceof HTMLButtonElement ||
  (element instanceof HTMLInputElement && BLURRING_INPUT_TYPES.has(element.type)) ||
  element.getAttribute("role") === "button";

const dispatchFocusIndicator = (element: HTMLElement): void => {
  window.dispatchEvent(
    new CustomEvent(FOCUS_INDICATOR_EVENT, {
      detail: {
        element
      }
    })
  );
};

const isElementDeepActive = (element: HTMLElement): boolean => getDeepActiveElement() === element;

const focusElement = (element: HTMLElement): void => {
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
};

const simulateSelect = (element: HTMLElement): boolean => {
  const activeElement = getDeepActiveElement();
  if (activeElement === element && isEditableElement(activeElement)) {
    dispatchFocusIndicator(element);
    return true;
  }

  focusElement(element);

  if (!isElementDeepActive(element)) {
    element.click();
    focusElement(element);
  }

  const didFocusImmediately = isElementDeepActive(element);

  if (!didFocusImmediately) {
    window.requestAnimationFrame(() => {
      if (isElementDeepActive(element)) {
        return;
      }

      focusElement(element);
    });
  }

  dispatchFocusIndicator(element);

  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return didFocusImmediately;
  }

  if (element instanceof HTMLTextAreaElement && element.value.includes("\n")) {
    return didFocusImmediately;
  }

  try {
    if (element.selectionStart === 0 && element.selectionEnd === 0) {
      element.setSelectionRange(element.value.length, element.value.length);
    }
  } catch {
    // Ignore elements without stable selection APIs.
  }

  return didFocusImmediately;
};

const simulateMouseInteraction = (
  element: HTMLElement,
  eventName: string,
  modifiers: MouseEventInit
): void => {
  const baseInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    detail: 1,
    ...modifiers
  };

  if (eventName.startsWith("pointer") && typeof PointerEvent !== "undefined") {
    element.dispatchEvent(
      new PointerEvent(eventName, {
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        ...baseInit
      })
    );
    return;
  }

  element.dispatchEvent(new MouseEvent(eventName, baseInit));
};

const simulateClick = (element: HTMLElement, modifiers: MouseEventInit = {}): void => {
  dispatchFocusIndicator(element);

  for (const eventName of [
    "pointerover",
    "mouseover",
    "pointerdown",
    "mousedown",
    "pointerup",
    "mouseup",
    "click"
  ]) {
    simulateMouseInteraction(element, eventName, modifiers);
  }
};

const clickElement = (element: HTMLElement): void => {
  simulateClick(element);

  if (document.activeElement === element && shouldBlurAfterActivation(element)) {
    element.blur();
  }
};

const dispatchModifiedClick = (element: HTMLElement, modifiers: MouseEventInit): void => {
  simulateClick(element, modifiers);

  if (document.activeElement === element && shouldBlurAfterActivation(element)) {
    element.blur();
  }
};

const openHintInCurrentTab = (element: HTMLElement): void => {
  if (isSelectableElement(element)) {
    window.focus();
    const didFocusImmediately = simulateSelect(element);
    window.dispatchEvent(
      new CustomEvent(HINT_SELECTABLE_ACTIVATED_EVENT, {
        detail: {
          didFocusImmediately
        }
      })
    );
    return;
  }

  if (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) {
    const previousTarget = element.target;
    if (previousTarget === "_blank") {
      element.target = "_self";
      clickElement(element);
      window.setTimeout(() => {
        element.target = previousTarget;
      }, 0);
      return;
    }
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLEmbedElement ||
    element instanceof HTMLObjectElement
  ) {
    element.focus();
  }

  clickElement(element);
};

const openHintInNewTab = (element: HTMLElement): void => {
  dispatchModifiedClick(element, {
    ctrlKey: !IS_MAC,
    metaKey: IS_MAC
  });
};

export const exitHints = (): void => {
  if (!hintState.active) return;

  clearFrameHandle();

  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange, true);
  window.removeEventListener("blur", exitHints, true);

  restoreRevealedHintControls(hintState.revealedHoverElements);
  hintState.overlay?.remove();

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
  revealHoverHintControls(mode, hintState.revealedHoverElements);

  const elements = collectHintTargets(mode);
  if (elements.length === 0) {
    restoreRevealedHintControls(hintState.revealedHoverElements);
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
    restoreRevealedHintControls(hintState.revealedHoverElements);
    return false;
  }

  document.documentElement.appendChild(overlay);

  hintState.active = true;
  hintState.mode = mode;
  hintState.typed = "";
  hintState.markers = markers;
  hintState.visibleMarkers = markers;
  hintState.labelIndex = buildHintLabelIndex(markers);
  hintState.overlay = overlay;
  hintState.onActivate = options.onActivate ?? null;

  revealVideoHintControls(markers, hintState.revealedHoverElements);

  updateMarkerPositions(
    hintState.markers,
    hintState.mode,
    highlightThumbnails,
    MARKER_VARIANT_STYLE_ATTRIBUTE
  );

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

  if (hintState.active) {
    exitHints();
  }
};

export const setReservedHintPrefixes = (prefixes: Iterable<string>): void => {
  reservedHintPrefixes = new Set(prefixes);
  clearHintLabelPlanCache();

  if (hintState.active) {
    exitHints();
  }
};

export const setAvoidedAdjacentHintPairs = (pairs: AdjacentHintPairs): void => {
  avoidedAdjacentHintPairs = pairs;
  clearHintLabelPlanCache();

  if (hintState.active) {
    exitHints();
  }
};

export const setReservedHintLabels = (labels: ReservedHintLabels): void => {
  reservedHintLabels = {
    input: [...labels.input],
    attach: [...labels.attach],
    home: [...labels.home],
    sidebar: [...labels.sidebar],
    next: [...labels.next],
    prev: [...labels.prev],
    cancel: [...labels.cancel],
    submit: [...labels.submit],
    like: [...labels.like],
    dislike: [...labels.dislike]
  };

  if (hintState.active) {
    exitHints();
  }
};

export const setMinHintLabelLength = (value: number): void => {
  minHintLabelLength = Number.isInteger(value) && value >= 1 ? value : 2;
  clearHintLabelPlanCache();

  if (hintState.active) {
    exitHints();
  }
};

export const setShowCapitalizedLetters = (nextShowCapitalizedLetters: boolean): void => {
  showCapitalizedLetters = nextShowCapitalizedLetters;

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