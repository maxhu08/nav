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
const LETTER_ATTRIBUTE = `data-${HINT_NAMESPACE_PREFIX}link-hint-marker-letter`;
const MARKER_STYLE_ATTRIBUTE = "data-nav-hint-marker";
const LETTER_STYLE_ATTRIBUTE = "data-nav-hint-marker-letter";
const STYLE_ID = `${HINT_NAMESPACE_PREFIX}link-hints-style`;
const FOCUS_INDICATOR_EVENT = `${HINT_NAMESPACE_PREFIX}focus-indicator`;
const IS_MAC = navigator.userAgent.includes("Mac");
let hintAlphabet = DEFAULT_HINT_CHARSET;
let reservedHintPrefixes = new Set<string>();
let avoidedAdjacentHintPairs: Partial<Record<string, Partial<Record<string, true>>>> = {};
let preferredSearchLabels: string[] = [];
let showCapitalizedLetters = true;
let hintCSS = "";

type LinkMode = "current-tab" | "new-tab";

type HintMarker = {
  element: HTMLElement;
  marker: HTMLSpanElement;
  label: string;
};

type PlacedMarkerRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
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

const MARKER_VIEWPORT_PADDING = 4;
const MARKER_COLLISION_GAP = 2;
const MARKER_POSITION_SEARCH_RADIUS = 6;

const getMarkerRect = (element: HTMLElement): DOMRect | null => {
  const rects = Array.from(element.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0
  );

  if (rects.length === 0) return null;

  rects.sort((a, b) => (a.top !== b.top ? a.top - b.top : a.left - b.left));
  return rects[0] ?? null;
};

const getTopElementAtPoint = (
  x: number,
  y: number,
  root: Document | ShadowRoot = document
): Element | null => {
  const topElement = root.elementsFromPoint(x, y)[0] ?? null;

  if (topElement instanceof HTMLElement && topElement.shadowRoot) {
    return getTopElementAtPoint(x, y, topElement.shadowRoot) ?? topElement;
  }

  return topElement;
};

const intersectsAtPoint = (element: HTMLElement, x: number, y: number): boolean => {
  const topElement = getTopElementAtPoint(x, y);

  return !!topElement && (element.contains(topElement) || topElement.contains(element));
};

const hasClickablePoint = (element: HTMLElement, rect: DOMRect): boolean => {
  const points: Array<[number, number]> = [
    [rect.left + rect.width * 0.5, rect.top + rect.height * 0.5],
    [rect.left + 0.1, rect.top + 0.1],
    [rect.right - 0.1, rect.top + 0.1],
    [rect.left + 0.1, rect.bottom - 0.1],
    [rect.right - 0.1, rect.bottom - 0.1]
  ];

  return points.some(([x, y]) => intersectsAtPoint(element, x, y));
};

const ACTIVATABLE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "combobox",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "textbox"
]);

const INTERACTIVE_ARIA_ATTRIBUTES = [
  "aria-checked",
  "aria-controls",
  "aria-expanded",
  "aria-haspopup",
  "aria-pressed",
  "aria-selected"
] as const;

const getElementTabIndex = (element: HTMLElement): number | null => {
  const tabIndexValue = element.getAttribute("tabindex");
  if (tabIndexValue === null) return null;

  const tabIndex = Number.parseInt(tabIndexValue, 10);
  return Number.isNaN(tabIndex) ? null : tabIndex;
};

const hasInteractiveRole = (element: HTMLElement): boolean => {
  const role = element.getAttribute("role")?.toLowerCase();
  return !!role && ACTIVATABLE_ROLES.has(role);
};

const hasInteractiveAriaState = (element: HTMLElement): boolean =>
  INTERACTIVE_ARIA_ATTRIBUTES.some((attributeName) => element.hasAttribute(attributeName));

const hasDirectActionAttribute = (element: HTMLElement): boolean =>
  element.hasAttribute("onclick") || element.hasAttribute("jsaction");

const isClickableByTagName = (element: HTMLElement, tagName: string): boolean => {
  switch (tagName) {
    case "a":
    case "area":
    case "object":
    case "embed":
    case "summary":
      return true;
    case "button":
    case "select":
      return !element.hasAttribute("disabled");
    case "textarea":
      return !element.hasAttribute("disabled") && !element.hasAttribute("readonly");
    case "input": {
      const input = element as HTMLInputElement;
      return (
        input.type !== "hidden" &&
        !input.disabled &&
        !(input.readOnly && isSelectableElement(input))
      );
    }
    case "label": {
      const label = element as HTMLLabelElement;
      const control = label.control;
      return !!control && !("disabled" in control && control.disabled);
    }
    default:
      return false;
  }
};

const isEditableHintTarget = (element: HTMLElement): boolean => {
  const contentEditable = element.getAttribute("contenteditable")?.toLowerCase();
  return !!contentEditable && ["", "contenteditable", "true"].includes(contentEditable);
};

const isCustomActivatableElement = (element: HTMLElement): boolean => {
  const tabIndex = getElementTabIndex(element);
  const isFocusable = tabIndex !== null && tabIndex >= 0;
  const style = window.getComputedStyle(element);
  const looksInteractive = style.cursor === "pointer" || hasInteractiveAriaState(element);

  if (hasInteractiveRole(element)) {
    return isFocusable || isEditableHintTarget(element) || looksInteractive;
  }

  if (!hasDirectActionAttribute(element)) {
    return false;
  }

  return isFocusable || looksInteractive;
};

const isActivatableElement = (element: HTMLElement): boolean => {
  if (isClickableByTagName(element, element.tagName.toLowerCase())) {
    return true;
  }

  if (isEditableHintTarget(element)) {
    return true;
  }

  return isCustomActivatableElement(element);
};

const isHintable = (element: HTMLElement): boolean => {
  if (
    element.hasAttribute("disabled") ||
    element.hasAttribute("inert") ||
    element.getAttribute("aria-disabled") === "true" ||
    element.closest("[inert],[aria-disabled='true'],fieldset[disabled]")
  ) {
    return false;
  }

  if (!isActivatableElement(element)) {
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
    rect.left <= window.innerWidth &&
    hasClickablePoint(element, rect)
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
    "object",
    "embed",
    "label",
    "summary",
    "[onclick]",
    "[role]",
    "[contenteditable='true']",
    "[contenteditable='']",
    "[jsaction]"
  ];

  const seen = new Set<HTMLElement>();
  const elements: HTMLElement[] = [];

  for (const element of Array.from(document.querySelectorAll<HTMLElement>(selectors.join(",")))) {
    if (seen.has(element) || !isHintable(element)) continue;
    seen.add(element);
    elements.push(element);
  }

  elements.sort((leftElement, rightElement) => {
    const leftRect = getMarkerRect(leftElement);
    const rightRect = getMarkerRect(rightElement);

    if (!leftRect || !rightRect) return 0;
    if (leftRect.top !== rightRect.top) return leftRect.top - rightRect.top;
    return leftRect.left - rightRect.left;
  });

  return elements;
};

const buildHintLabels = (
  count: number,
  reservedLabel: string | null = null
): { labelLength: number; labels: string[] } => {
  if (count <= 0) {
    return { labelLength: 0, labels: [] };
  }

  const buildLabels = (
    blockedPairs: Partial<Record<string, Partial<Record<string, true>>>>
  ): { labelLength: number; labels: string[] } => {
    const alphabet = hintAlphabet.split("");
    const firstCharacters = alphabet.filter((char) => !reservedHintPrefixes.has(char));
    const leadingAlphabet = firstCharacters.length > 0 ? firstCharacters : alphabet;
    const labels: string[] = [];
    const subtreeCapacityCache = new Map<string, number>();

    const getAllowedCharacters = (
      previousChar: string | null,
      isLeadingCharacter: boolean
    ): string[] => {
      if (isLeadingCharacter) {
        return leadingAlphabet;
      }

      return alphabet.filter(
        (char) => previousChar === null || blockedPairs[previousChar]?.[char] !== true
      );
    };

    const getSubtreeCapacity = (
      previousChar: string | null,
      remainingLength: number,
      isLeadingCharacter: boolean
    ): number => {
      if (remainingLength <= 0) return 1;

      const cacheKey = `${previousChar ?? "_"}:${remainingLength}:${isLeadingCharacter ? "1" : "0"}`;
      const cachedCapacity = subtreeCapacityCache.get(cacheKey);
      if (cachedCapacity !== undefined) {
        return cachedCapacity;
      }

      let subtreeCapacity = 0;

      for (const char of getAllowedCharacters(previousChar, isLeadingCharacter)) {
        subtreeCapacity += getSubtreeCapacity(char, remainingLength - 1, false);
      }

      subtreeCapacityCache.set(cacheKey, subtreeCapacity);
      return subtreeCapacity;
    };

    let labelLength = 1;
    let capacity = getSubtreeCapacity(null, labelLength, true);

    while (capacity < count) {
      const nextLength = labelLength + 1;
      const nextCapacity = getSubtreeCapacity(null, nextLength, true);

      if (nextCapacity <= capacity) {
        return { labelLength, labels: [] };
      }

      labelLength = nextLength;
      capacity = nextCapacity;
    }

    const appendLabels = (
      prefix: string,
      previousChar: string | null,
      remainingCount: number,
      remainingLength: number,
      isLeadingCharacter: boolean
    ): void => {
      if (remainingCount <= 0) return;

      const sourceAlphabet = getAllowedCharacters(previousChar, isLeadingCharacter);
      let assignedCount = 0;

      for (let index = 0; index < sourceAlphabet.length; index += 1) {
        const char = sourceAlphabet[index];
        const nextLabel = `${prefix}${char}`;
        const remainingBuckets = sourceAlphabet.length - index;
        const nextRemainingCount = remainingCount - assignedCount;
        const subtreeCapacity = getSubtreeCapacity(char, remainingLength - 1, false);
        const bucketCount = Math.min(
          subtreeCapacity,
          Math.ceil(nextRemainingCount / remainingBuckets)
        );

        if (bucketCount <= 0) continue;

        if (remainingLength === 1 && doesLabelConflictWithReservedLabel(nextLabel, reservedLabel)) {
          continue;
        }

        if (remainingLength === 1) {
          labels.push(nextLabel);
        } else {
          appendLabels(nextLabel, char, bucketCount, remainingLength - 1, false);
        }

        assignedCount += bucketCount;
        if (assignedCount >= remainingCount || labels.length >= count) return;
      }
    };

    appendLabels("", null, count, labelLength, true);

    if (labels.length > count) {
      labels.length = count;
    }

    return {
      labelLength,
      labels: labels.slice(0, count - (reservedLabel ? 1 : 0))
    };
  };

  const labels = buildLabels(avoidedAdjacentHintPairs);
  if (labels.labels.length === count - (reservedLabel ? 1 : 0)) {
    return labels;
  }

  return buildLabels({});
};

const SEARCH_ATTRIBUTE_PATTERNS = [
  /search/i,
  /find/i,
  /query/i,
  /prompt/i,
  /ask/i,
  /chat/i,
  /message/i,
  /composer/i
];

const getSearchCandidateScore = (element: HTMLElement): number => {
  if (!isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = getMarkerRect(element);
  if (!rect) return Number.NEGATIVE_INFINITY;

  let score = 100;
  const attributeText = [
    element.getAttribute("type"),
    element.getAttribute("name"),
    element.getAttribute("id"),
    element.getAttribute("placeholder"),
    element.getAttribute("aria-label"),
    element.getAttribute("data-testid"),
    element.getAttribute("role")
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");

  for (const pattern of SEARCH_ATTRIBUTE_PATTERNS) {
    if (pattern.test(attributeText)) {
      score += 120;
      break;
    }
  }

  if (element === getDeepActiveElement()) {
    score += 80;
  }

  if (
    element instanceof HTMLInputElement &&
    ["search", "text", "email", "url", "tel"].includes(element.type)
  ) {
    score += 40;
  }

  if (element instanceof HTMLTextAreaElement || element.isContentEditable) {
    score += 60;
  }

  if (element.closest("search, [role='search'], form")) {
    score += 30;
  }

  score += Math.min(400, rect.width) / 4;
  score += Math.min(120, rect.height) / 6;

  return score;
};

const getPreferredSearchElementIndex = (elements: HTMLElement[]): number | null => {
  let bestIndex: number | null = null;
  let bestScore = 180;

  elements.forEach((element, index) => {
    const score = getSearchCandidateScore(element);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const isPreferredSearchLabelValid = (label: string, labelLength: number): boolean => {
  if (label.length < labelLength) return false;

  const alphabet = new Set(hintAlphabet.split(""));
  if (label.length === 0 || reservedHintPrefixes.has(label[0] ?? "")) {
    return false;
  }

  for (let index = 0; index < label.length; index += 1) {
    if (!alphabet.has(label[index]!)) {
      return false;
    }

    if (
      index > 0 &&
      avoidedAdjacentHintPairs[label[index - 1] ?? ""]?.[label[index] ?? ""] === true
    ) {
      return false;
    }
  }

  return true;
};

const doesLabelConflictWithReservedLabel = (
  label: string,
  reservedLabel: string | null
): boolean => {
  if (!reservedLabel) return false;

  return label.startsWith(reservedLabel) || reservedLabel.startsWith(label);
};

const getPreferredSearchLabel = (labelLength: number): string | null => {
  const label = preferredSearchLabels.find(
    (preferredSearchLabel) => preferredSearchLabel.length === labelLength
  );
  return label && label.length === labelLength && isPreferredSearchLabelValid(label, labelLength)
    ? label
    : null;
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

  return overlay;
};

const getDefaultHintMarkerCSS = (): string => {
  const markerSelector = `[${MARKER_STYLE_ATTRIBUTE}]`;
  const pendingSelector = `[${LETTER_STYLE_ATTRIBUTE}="pending"]`;
  const typedSelector = `[${LETTER_STYLE_ATTRIBUTE}="typed"]`;

  return `${markerSelector}{transform:translate(-20%,-20%);padding:1px 4px;border-radius:3px;background:#eab308;color:#2b1d00;font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:700;letter-spacing:.08em;line-height:1.2;box-shadow:0 1px 3px rgba(0,0,0,.28);white-space:nowrap;}${pendingSelector}{color:#000000;}${typedSelector}{color:#ffffff;}`;
};

const applyHintStyles = (): void => {
  const existing = document.getElementById(STYLE_ID);

  if (existing instanceof HTMLStyleElement) {
    if (existing.textContent !== hintCSS) {
      existing.textContent = hintCSS;
    }
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = hintCSS;
  document.head.appendChild(style);
};

const renderMarkerText = (marker: HTMLSpanElement, label: string, typed: string): void => {
  marker.replaceChildren();

  const displayLabel = showCapitalizedLetters ? label.toUpperCase() : label.toLowerCase();

  for (const [index, char] of Array.from(displayLabel).entries()) {
    const letter = document.createElement("span");
    const isTyped = typed.length > 0 && index < typed.length && label[index] === typed[index];

    letter.textContent = char;
    letter.setAttribute(LETTER_ATTRIBUTE, isTyped ? "typed" : "pending");
    letter.setAttribute(LETTER_STYLE_ATTRIBUTE, isTyped ? "typed" : "pending");

    marker.appendChild(letter);
  }
};

const createMarker = (label: string): HTMLSpanElement => {
  const marker = document.createElement("span");
  marker.setAttribute(MARKER_ATTRIBUTE, "true");
  marker.setAttribute(MARKER_STYLE_ATTRIBUTE, "true");

  marker.style.position = "fixed";
  marker.style.left = "0px";
  marker.style.top = "0px";

  renderMarkerText(marker, label, "");

  return marker;
};

const doPlacedMarkerRectsOverlap = (left: PlacedMarkerRect, right: PlacedMarkerRect): boolean =>
  left.left < right.right + MARKER_COLLISION_GAP &&
  left.right > right.left - MARKER_COLLISION_GAP &&
  left.top < right.bottom + MARKER_COLLISION_GAP &&
  left.bottom > right.top - MARKER_COLLISION_GAP;

const clampMarkerPosition = (
  left: number,
  top: number,
  width: number,
  height: number
): Pick<PlacedMarkerRect, "left" | "top"> => ({
  left: Math.min(
    Math.max(MARKER_VIEWPORT_PADDING, left),
    Math.max(MARKER_VIEWPORT_PADDING, window.innerWidth - width - MARKER_VIEWPORT_PADDING)
  ),
  top: Math.min(
    Math.max(MARKER_VIEWPORT_PADDING, top),
    Math.max(MARKER_VIEWPORT_PADDING, window.innerHeight - height - MARKER_VIEWPORT_PADDING)
  )
});

const createPlacedMarkerRect = (
  left: number,
  top: number,
  width: number,
  height: number
): PlacedMarkerRect => ({
  left,
  top,
  right: left + width,
  bottom: top + height
});

const getMarkerPositionCandidates = (
  targetRect: DOMRect,
  markerWidth: number,
  markerHeight: number
): Array<Pick<PlacedMarkerRect, "left" | "top">> => {
  const horizontalStep = Math.max(12, Math.round(markerWidth * 0.7));
  const verticalStep = Math.max(10, Math.round(markerHeight * 0.85));
  const candidates: Array<Pick<PlacedMarkerRect, "left" | "top">> = [];
  const seen = new Set<string>();
  const pushCandidate = (left: number, top: number): void => {
    const clamped = clampMarkerPosition(left, top, markerWidth, markerHeight);
    const key = `${Math.round(clamped.left)}:${Math.round(clamped.top)}`;

    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(clamped);
  };

  for (let radius = 0; radius <= MARKER_POSITION_SEARCH_RADIUS; radius += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;

        pushCandidate(targetRect.left + x * horizontalStep, targetRect.top + y * verticalStep);
      }
    }
  }

  return candidates;
};

const updateMarkerPositions = (): void => {
  const placedRects: PlacedMarkerRect[] = [];

  for (const hint of hintState.markers) {
    const targetRect = getMarkerRect(hint.element);

    if (!targetRect) {
      hint.marker.style.display = "none";
      continue;
    }

    hint.marker.style.display = "";

    const markerRect = hint.marker.getBoundingClientRect();
    const markerWidth = Math.max(1, Math.round(markerRect.width));
    const markerHeight = Math.max(1, Math.round(markerRect.height));
    const candidates = getMarkerPositionCandidates(targetRect, markerWidth, markerHeight);

    let chosenRect: PlacedMarkerRect | null = null;

    for (const candidate of candidates) {
      const nextRect = createPlacedMarkerRect(
        candidate.left,
        candidate.top,
        markerWidth,
        markerHeight
      );

      if (placedRects.every((placedRect) => !doPlacedMarkerRectsOverlap(placedRect, nextRect))) {
        chosenRect = nextRect;
        break;
      }
    }

    const fallbackPosition = clampMarkerPosition(
      targetRect.left,
      targetRect.top,
      markerWidth,
      markerHeight
    );
    const nextRect =
      chosenRect ??
      createPlacedMarkerRect(
        fallbackPosition.left,
        fallbackPosition.top,
        markerWidth,
        markerHeight
      );

    hint.marker.style.left = `${Math.round(nextRect.left)}px`;
    hint.marker.style.top = `${Math.round(nextRect.top)}px`;
    placedRects.push(nextRect);
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
  simulateClick(element);

  if (document.activeElement === element && shouldBlurAfterActivation(element)) {
    element.blur();
  }
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

const dispatchModifiedClick = (element: HTMLElement, modifiers: MouseEventInit): void => {
  simulateClick(element, modifiers);

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
  const exactMatch = matches.find((hint) => hint.label === typed);

  for (const hint of hintState.markers) {
    const isMatch = typed.length === 0 || hint.label.startsWith(typed);
    renderMarkerText(hint.marker, hint.label, isMatch ? typed : "");
    hint.marker.style.display = isMatch ? "" : "none";
  }

  if (exactMatch) {
    activateHint(exactMatch);
  }
};

export const activateHints = (mode: LinkMode): boolean => {
  exitHints();
  applyHintStyles();

  const elements = getHintableElements();
  if (elements.length === 0) return false;

  const preferredSearchElementIndex = getPreferredSearchElementIndex(elements);
  const initialLabelPlan = buildHintLabels(elements.length);
  const reservedPreferredLabel =
    preferredSearchElementIndex === null
      ? null
      : getPreferredSearchLabel(initialLabelPlan.labelLength);
  const { labels } = buildHintLabels(elements.length, reservedPreferredLabel);
  const overlay = createOverlay();
  const markers: HintMarker[] = [];
  let labelIndex = 0;

  elements.forEach((element, index) => {
    const rect = getMarkerRect(element);
    if (!rect) return;

    const label =
      reservedPreferredLabel && index === preferredSearchElementIndex
        ? reservedPreferredLabel
        : labels[labelIndex++];

    if (!label) return;
    const marker = createMarker(label);

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

  updateMarkerPositions();

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

  if (hintState.active) {
    exitHints();
  }
};

export const setReservedHintPrefixes = (prefixes: Iterable<string>): void => {
  reservedHintPrefixes = new Set(prefixes);

  if (hintState.active) {
    exitHints();
  }
};

export const setAvoidedAdjacentHintPairs = (
  pairs: Partial<Record<string, Partial<Record<string, true>>>>
): void => {
  avoidedAdjacentHintPairs = pairs;

  if (hintState.active) {
    exitHints();
  }
};

export const setPreferredSearchLabels = (labels: string[]): void => {
  preferredSearchLabels = labels;

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
    renderMarkerText(hint.marker, hint.label, isMatch ? hintState.typed : "");
  }
};

export const setHintCSS = (nextHintCSS: string): void => {
  hintCSS = nextHintCSS || getDefaultHintMarkerCSS();
  applyHintStyles();
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
    const exactMatch = matches.find((hint) => hint.label === hintState.typed);

    if (exactMatch) {
      activateHint(exactMatch);
      return true;
    }

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
