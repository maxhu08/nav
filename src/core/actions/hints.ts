import { getExtensionNamespace } from "~/src/utils/extension-id";
import { DEFAULT_HINT_CHARSET } from "~/src/utils/hotkeys";
import {
  getDeepActiveElement,
  isEditableElement,
  isSelectableElement
} from "~/src/core/utils/isEditableTarget";

const HINT_NAMESPACE_PREFIX = `nav-${getExtensionNamespace()}-`;
const OVERLAY_ID = `${HINT_NAMESPACE_PREFIX}link-hints-overlay`;
const MARKER_ATTRIBUTE = `data-${HINT_NAMESPACE_PREFIX}link-hint-marker`;
const FOCUS_INDICATOR_EVENT = `${HINT_NAMESPACE_PREFIX}focus-indicator`;
const IS_MAC = navigator.userAgent.includes("Mac");
let hintAlphabet = DEFAULT_HINT_CHARSET;

type LinkMode = "current-tab" | "new-tab";

type HintMarker = {
  element: HTMLElement;
  marker: HTMLSpanElement;
  label: string;
};

type HintState = {
  active: boolean;
  mode: LinkMode;
  typed: string;
  markers: HintMarker[];
  overlay: HTMLDivElement | null;
  frameHandle: number | null;
};

const hintState: HintState = {
  active: false,
  mode: "current-tab",
  typed: "",
  markers: [],
  overlay: null,
  frameHandle: null
};

const getMarkerRect = (element: HTMLElement): DOMRect | null => {
  const rects = Array.from(element.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0
  );

  if (rects.length === 0) return null;

  rects.sort((a, b) => (a.top !== b.top ? a.top - b.top : a.left - b.left));
  return rects[0] ?? null;
};

const isHintable = (element: HTMLElement): boolean => {
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse" ||
    Number.parseFloat(style.opacity) === 0
  ) {
    return false;
  }

  const rect = getMarkerRect(element);
  if (!rect) return false;

  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth
  );
};

const getHintableElements = (): HTMLElement[] => {
  const selectors = [
    "a[href]",
    "area[href]",
    "button",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "summary",
    "[onclick]",
    "[role='button']",
    "[role='link']",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable]",
    "[contenteditable='true']"
  ];

  const seen = new Set<HTMLElement>();
  const elements: HTMLElement[] = [];

  for (const element of Array.from(document.querySelectorAll<HTMLElement>(selectors.join(",")))) {
    if (seen.has(element) || !isHintable(element)) continue;
    seen.add(element);
    elements.push(element);
  }

  return elements;
};

const buildHintLabels = (count: number): string[] => {
  if (count <= 0) return [];

  const alphabet = hintAlphabet.split("");
  const labels = [""];

  while (labels.length < count + 1) {
    const next: string[] = [];

    for (const prefix of labels) {
      for (const char of alphabet) next.push(`${prefix}${char}`);
    }

    labels.splice(0, labels.length, ...next);
  }

  return labels.slice(0, count);
};

const createOverlay = (): HTMLDivElement => {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing instanceof HTMLDivElement) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute(MARKER_ATTRIBUTE, "true");

  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.pointerEvents = "none";
  overlay.style.fontFamily = '"JetBrains Mono", monospace"';

  return overlay;
};

const renderMarkerText = (marker: HTMLSpanElement, label: string, typed: string): void => {
  marker.replaceChildren();

  for (const [index, char] of Array.from(label.toUpperCase()).entries()) {
    const letter = document.createElement("span");
    const isTyped = typed.length > 0 && index < typed.length && label[index] === typed[index];

    letter.textContent = char;
    letter.style.color = isTyped ? "#ffffff" : "#000000";

    marker.appendChild(letter);
  }
};

const createMarker = (label: string, rect: DOMRect): HTMLSpanElement => {
  const marker = document.createElement("span");
  marker.setAttribute(MARKER_ATTRIBUTE, "true");

  marker.style.position = "fixed";
  marker.style.left = `${Math.max(0, Math.round(rect.left))}px`;
  marker.style.top = `${Math.max(0, Math.round(rect.top))}px`;
  marker.style.transform = "translate(-20%, -20%)";
  marker.style.padding = "1px 4px";
  marker.style.borderRadius = "3px";
  marker.style.background = "#eab308";
  marker.style.color = "#2b1d00";
  marker.style.fontSize = "12px";
  marker.style.fontWeight = "700";
  marker.style.letterSpacing = "0.08em";
  marker.style.lineHeight = "1.2";
  marker.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.28)";
  marker.style.whiteSpace = "nowrap";

  renderMarkerText(marker, label, "");

  return marker;
};

const updateMarkerPositions = (): void => {
  for (const hint of hintState.markers) {
    const rect = getMarkerRect(hint.element);

    if (!rect) {
      hint.marker.style.display = "none";
      continue;
    }

    hint.marker.style.display = "";
    hint.marker.style.left = `${Math.max(0, Math.round(rect.left))}px`;
    hint.marker.style.top = `${Math.max(0, Math.round(rect.top))}px`;
  }
};

const schedulePositionUpdate = (): void => {
  if (!hintState.active || hintState.frameHandle !== null) return;

  hintState.frameHandle = window.requestAnimationFrame(() => {
    hintState.frameHandle = null;
    updateMarkerPositions();
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
  (element instanceof HTMLInputElement &&
    new Set([
      "button",
      "checkbox",
      "color",
      "file",
      "image",
      "radio",
      "range",
      "reset",
      "submit"
    ]).has(element.type)) ||
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

const simulateSelect = (element: HTMLElement): void => {
  const activeElement = getDeepActiveElement();
  if (activeElement === element && isEditableElement(activeElement)) {
    dispatchFocusIndicator(element);
    return;
  }

  element.focus();
  dispatchFocusIndicator(element);

  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return;
  }

  if (element instanceof HTMLTextAreaElement && element.value.includes("\n")) {
    return;
  }

  try {
    if (element.selectionStart === 0 && element.selectionEnd === 0) {
      element.setSelectionRange(element.value.length, element.value.length);
    }
  } catch {
    // Ignore elements without stable selection APIs.
  }
};

const clickElement = (element: HTMLElement): void => {
  dispatchFocusIndicator(element);
  element.click();

  if (document.activeElement === element && shouldBlurAfterActivation(element)) {
    element.blur();
  }
};

const dispatchModifiedClick = (element: HTMLElement, modifiers: MouseEventInit): void => {
  dispatchFocusIndicator(element);
  element.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      ...modifiers
    })
  );

  if (document.activeElement === element && shouldBlurAfterActivation(element)) {
    element.blur();
  }
};

const openHintInCurrentTab = (element: HTMLElement): void => {
  if (isSelectableElement(element)) {
    window.focus();
    simulateSelect(element);
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
  if (
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
    element.href
  ) {
    const openedWindow = window.open(element.href, "_blank", "noopener,noreferrer");
    if (openedWindow) return;
  }

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

  hintState.overlay?.remove();

  hintState.active = false;
  hintState.mode = "current-tab";
  hintState.typed = "";
  hintState.markers = [];
  hintState.overlay = null;
};

const activateHint = (hint: HintMarker): void => {
  const mode = hintState.mode;
  exitHints();

  if (mode === "new-tab") {
    openHintInNewTab(hint.element);
    return;
  }

  openHintInCurrentTab(hint.element);
};

const applyFilter = (): void => {
  const typed = hintState.typed;
  const matches = hintState.markers.filter((hint) => hint.label.startsWith(typed));

  for (const hint of hintState.markers) {
    const isMatch = typed.length === 0 || hint.label.startsWith(typed);
    renderMarkerText(hint.marker, hint.label, isMatch ? typed : "");
    hint.marker.style.display = isMatch ? "" : "none";
  }

  if (matches.length === 1 && matches[0]?.label === typed) {
    activateHint(matches[0]);
  }
};

export const activateHints = (mode: LinkMode): boolean => {
  exitHints();

  const elements = getHintableElements();
  if (elements.length === 0) return false;

  const labels = buildHintLabels(elements.length);
  const overlay = createOverlay();
  const markers: HintMarker[] = [];

  elements.forEach((element, index) => {
    const rect = getMarkerRect(element);
    if (!rect) return;

    const label = labels[index];
    const marker = createMarker(label, rect);

    overlay.appendChild(marker);
    markers.push({ element, marker, label });
  });

  if (markers.length === 0) return false;

  document.documentElement.appendChild(overlay);

  hintState.active = true;
  hintState.mode = mode;
  hintState.typed = "";
  hintState.markers = markers;
  hintState.overlay = overlay;

  window.addEventListener("scroll", onViewportChange, true);
  window.addEventListener("resize", onViewportChange, true);
  window.addEventListener("blur", exitHints, true);

  return true;
};

export const areHintsActive = (): boolean => hintState.active;

export const setHintCharset = (charset: string): void => {
  hintAlphabet = charset;

  if (hintState.active) {
    exitHints();
  }
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
    const matches = hintState.markers.filter((hint) => hint.label.startsWith(hintState.typed));
    if (matches.length === 1) activateHint(matches[0]);
    return true;
  }

  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
    return true;
  }

  const key = event.key.toLowerCase();
  if (!hintAlphabet.includes(key)) return true;

  hintState.typed += key;
  applyFilter();
  return true;
};
