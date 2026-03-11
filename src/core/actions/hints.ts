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
const MARKER_VARIANT_STYLE_ATTRIBUTE = "data-nav-hint-marker-variant";
const LETTER_STYLE_ATTRIBUTE = "data-nav-hint-marker-letter";
const STYLE_ID = `${HINT_NAMESPACE_PREFIX}link-hints-style`;
const FOCUS_INDICATOR_EVENT = `${HINT_NAMESPACE_PREFIX}focus-indicator`;
const IS_MAC = navigator.userAgent.includes("Mac");
let hintAlphabet = DEFAULT_HINT_CHARSET;
let reservedHintPrefixes = new Set<string>();
let avoidedAdjacentHintPairs: Partial<Record<string, Partial<Record<string, true>>>> = {};
let reservedHintLabels: {
  search: string[];
  home: string[];
} = {
  search: [],
  home: []
};
let minHintLabelLength = 2;
let showCapitalizedLetters = true;
let highlightThumbnails = false;
let hintCSS = "";

type LinkMode = "current-tab" | "new-tab" | "copy-link" | "copy-image";

type HintMarker = {
  element: HTMLElement;
  marker: HTMLSpanElement;
  label: string;
  letters: HTMLSpanElement[];
  visible: boolean;
  renderedTyped: string;
};

type PlacedMarkerRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type RectLike = Pick<DOMRect, "left" | "top" | "right" | "bottom" | "width" | "height">;

type MarkerVariant = "default" | "thumbnail";

type HintState = {
  active: boolean;
  mode: LinkMode;
  typed: string;
  previousTyped: string;
  markers: HintMarker[];
  visibleMarkers: HintMarker[];
  markerByLabel: Map<string, HintMarker>;
  overlay: HTMLDivElement | null;
  onActivate: ((element: HTMLElement) => void) | null;
  frameHandle: number | null;
  revealedVideoHoverElements: Array<{
    element: HTMLElement;
    inlineStyle: string | null;
  }>;
};

const hintState: HintState = {
  active: false,
  mode: "current-tab",
  typed: "",
  previousTyped: "",
  markers: [],
  visibleMarkers: [],
  markerByLabel: new Map(),
  overlay: null,
  onActivate: null,
  frameHandle: null,
  revealedVideoHoverElements: []
};

const MARKER_VIEWPORT_PADDING = 4;
const MARKER_COLLISION_GAP = 2;
const MARKER_ANCHOR_INSET = 2;
const MARKER_COLLISION_CELL_SIZE = 80;
const MIN_THUMBNAIL_WIDTH = 96;
const MIN_THUMBNAIL_HEIGHT = 54;
const MIN_THUMBNAIL_MEDIA_AREA_RATIO = 0.45;
const MIN_THUMBNAIL_ASPECT_RATIO = 1.15;
const MIN_COPY_IMAGE_THUMBNAIL_WIDTH = 180;
const MIN_COPY_IMAGE_THUMBNAIL_HEIGHT = 120;

const labelPlanCache = new Map<string, { labelLength: number; labels: string[] }>();

const clearLabelPlanCache = (): void => {
  labelPlanCache.clear();
};

const getMarkerRect = (element: HTMLElement): DOMRect | null => {
  const rects = Array.from(element.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0
  );

  if (rects.length === 0) return null;

  rects.sort((a, b) => (a.top !== b.top ? a.top - b.top : a.left - b.left));
  return rects[0] ?? null;
};

const getDomDepth = (element: HTMLElement): number => {
  let depth = 0;
  let current: HTMLElement | null = element;

  while (current) {
    depth += 1;
    current = current.parentElement;
  }

  return depth;
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

const isComposedDescendant = (ancestor: Element, node: Element): boolean => {
  let current: Node | null = node;

  while (current) {
    if (current === ancestor) {
      return true;
    }

    if (current instanceof ShadowRoot) {
      current = current.host;
      continue;
    }

    current = current.parentNode;
  }

  return false;
};

const intersectsAtPoint = (element: HTMLElement, x: number, y: number): boolean => {
  const topElement = getTopElementAtPoint(x, y);

  return (
    !!topElement &&
    (isComposedDescendant(element, topElement) || isComposedDescendant(topElement, element))
  );
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

const INTERACTIVE_DATA_ATTRIBUTES = ["data-state"] as const;

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

const hasInteractiveDataState = (element: HTMLElement): boolean =>
  INTERACTIVE_DATA_ATTRIBUTES.some((attributeName) => element.hasAttribute(attributeName));

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

const areRectsEquivalent = (leftRect: DOMRect, rightRect: DOMRect): boolean =>
  Math.abs(leftRect.top - rightRect.top) < 1 &&
  Math.abs(leftRect.left - rightRect.left) < 1 &&
  Math.abs(leftRect.width - rightRect.width) < 1 &&
  Math.abs(leftRect.height - rightRect.height) < 1;

const getHintIdentity = (element: HTMLElement): string | null => {
  if (
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
    element.href
  ) {
    return `href:${element.href}`;
  }

  const rawHref = element.getAttribute("href");
  if (rawHref) {
    return `href:${rawHref}`;
  }

  if (element instanceof HTMLLabelElement && element.control) {
    const controlId = element.control.id || element.control.getAttribute("name") || "";
    return `label:${element.control.tagName}:${controlId}`;
  }

  const ariaLabel = element.getAttribute("aria-label")?.trim();
  if (ariaLabel) {
    return `label:${ariaLabel}`;
  }

  const title = element.getAttribute("title")?.trim();
  if (title) {
    return `title:${title}`;
  }

  const text = element.textContent?.replace(/\s+/g, " ").trim();
  if (text) {
    return `text:${text}`;
  }

  return null;
};

const getHintTargetPreference = (element: HTMLElement): number => {
  let score = 0;

  if (
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
    element.href
  ) {
    score += 500;
  }

  if (element instanceof HTMLButtonElement) {
    score += 450;
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    score += 425;
  }

  if (element instanceof HTMLLabelElement && element.control) {
    score += 400;
  }

  if (isSelectableElement(element)) {
    score += 350;
  }

  if (hasInteractiveRole(element)) {
    score += 250;
  }

  const tabIndex = getElementTabIndex(element);
  if (tabIndex !== null && tabIndex >= 0) {
    score += 125;
  }

  score += getDomDepth(element);
  return score;
};

const getApproximateRectKey = (rect: RectLike): string => {
  const round = (value: number): number => Math.round(value * 2) / 2;
  return `${round(rect.top)}:${round(rect.left)}:${round(rect.width)}:${round(rect.height)}`;
};

const getEquivalentTargetBucketKey = (
  element: HTMLElement,
  rect: RectLike | null,
  identity: string | null
): string => {
  const role = element.getAttribute("role")?.toLowerCase() ?? "";
  const rectKey = rect ? getApproximateRectKey(rect) : "no-rect";
  return `${rectKey}|${identity ?? ""}|${role}|${element.tagName}`;
};

const areEquivalentHintTargets = (
  leftElement: HTMLElement,
  rightElement: HTMLElement,
  getRect: (element: HTMLElement) => DOMRect | null = getMarkerRect,
  getIdentity: (element: HTMLElement) => string | null = getHintIdentity
): boolean => {
  if (!leftElement.contains(rightElement) && !rightElement.contains(leftElement)) {
    return false;
  }

  const leftRect = getRect(leftElement);
  const rightRect = getRect(rightElement);
  if (!leftRect || !rightRect || !areRectsEquivalent(leftRect, rightRect)) {
    return false;
  }

  const leftIdentity = getIdentity(leftElement);
  const rightIdentity = getIdentity(rightElement);

  if (leftIdentity && rightIdentity) {
    return leftIdentity === rightIdentity;
  }

  const leftRole = leftElement.getAttribute("role")?.toLowerCase() ?? null;
  const rightRole = rightElement.getAttribute("role")?.toLowerCase() ?? null;

  if (leftRole || rightRole) {
    return leftRole === rightRole;
  }

  return leftElement.tagName === rightElement.tagName;
};

const dedupeHintTargets = (
  elements: HTMLElement[],
  getRect: (element: HTMLElement) => DOMRect | null = getMarkerRect,
  getIdentity: (element: HTMLElement) => string | null = getHintIdentity,
  getPreference: (element: HTMLElement) => number = getHintTargetPreference
): HTMLElement[] => {
  const bucketMap = new Map<string, HTMLElement[]>();

  for (const element of elements) {
    const bucketKey = getEquivalentTargetBucketKey(element, getRect(element), getIdentity(element));
    const bucket = bucketMap.get(bucketKey);

    if (bucket) {
      bucket.push(element);
      continue;
    }

    bucketMap.set(bucketKey, [element]);
  }

  const deduped: HTMLElement[] = [];

  for (const bucket of bucketMap.values()) {
    const representatives: HTMLElement[] = [];

    for (const element of bucket) {
      const duplicateIndex = representatives.findIndex((candidate) =>
        areEquivalentHintTargets(candidate, element, getRect, getIdentity)
      );

      if (duplicateIndex === -1) {
        representatives.push(element);
        continue;
      }

      const existing = representatives[duplicateIndex];
      if (existing && getPreference(element) > getPreference(existing)) {
        representatives[duplicateIndex] = element;
      }
    }

    deduped.push(...representatives);
  }

  return deduped;
};

const hasEquivalentAncestorTarget = (
  element: HTMLElement,
  candidates: ReadonlySet<HTMLElement>,
  getRect: (element: HTMLElement) => DOMRect | null = getMarkerRect
): boolean => {
  if (!(element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement)) {
    return false;
  }

  const resolvedHref = element.href;
  if (!resolvedHref) {
    return false;
  }

  const elementRect = getRect(element);
  if (!elementRect) {
    return false;
  }

  let current = element.parentElement;

  while (current) {
    if (
      candidates.has(current) &&
      current.contains(element) &&
      (current.getAttribute("role")?.toLowerCase() === "link" ||
        getElementTabIndex(current) !== null)
    ) {
      const currentRect = getRect(current);
      const currentHref = current.getAttribute("href");

      if (
        currentRect &&
        elementRect &&
        areRectsEquivalent(currentRect, elementRect) &&
        (!currentHref || currentHref === resolvedHref)
      ) {
        return true;
      }
    }

    current = current.parentElement;
  }

  return false;
};

const isCustomActivatableElement = (element: HTMLElement): boolean => {
  const tabIndex = getElementTabIndex(element);
  const isFocusable = tabIndex !== null && tabIndex >= 0;
  const style = window.getComputedStyle(element);
  const hasInteractiveState = hasInteractiveAriaState(element) || hasInteractiveDataState(element);
  const looksInteractive = style.cursor === "pointer" || hasInteractiveState;

  if (hasInteractiveRole(element)) {
    return isFocusable || isEditableHintTarget(element) || looksInteractive;
  }

  if (hasDirectActionAttribute(element)) {
    return isFocusable || looksInteractive;
  }

  return isFocusable && looksInteractive;
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

const isExcludedHintTarget = (element: HTMLElement): boolean => {
  return (
    !!element.closest("[data-sonner-toaster]") ||
    element.hasAttribute("disabled") ||
    element.hasAttribute("inert") ||
    element.getAttribute("aria-disabled") === "true" ||
    !!element.closest("[inert],[aria-disabled='true'],fieldset[disabled]")
  );
};

const isElementVisibleAndClickable = (element: HTMLElement): boolean => {
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
  if (!rect) {
    return false;
  }

  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth &&
    hasClickablePoint(element, rect)
  );
};

const isHintable = (element: HTMLElement): boolean => {
  if (isExcludedHintTarget(element)) {
    return false;
  }

  if (!isActivatableElement(element)) {
    return false;
  }

  return isElementVisibleAndClickable(element);
};

const isVisibleHintTarget = (element: HTMLElement): boolean => {
  if (isExcludedHintTarget(element)) {
    return false;
  }

  return isElementVisibleAndClickable(element);
};

const HINT_SELECTORS_COPY_LINK = "a[href],area[href]";
const HINT_SELECTORS_COPY_IMAGE = "img";
const HINT_SELECTORS_DEFAULT = [
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
  "[tabindex]",
  "[contenteditable='true']",
  "[contenteditable='']",
  "[jsaction]"
].join(",");

const getHintSelector = (mode: LinkMode): string => {
  if (mode === "copy-link") {
    return HINT_SELECTORS_COPY_LINK;
  }

  if (mode === "copy-image") {
    return HINT_SELECTORS_COPY_IMAGE;
  }

  return HINT_SELECTORS_DEFAULT;
};

type HintCollectionContext = {
  getRect: (element: HTMLElement) => DOMRect | null;
  getIdentity: (element: HTMLElement) => string | null;
  getDepth: (element: HTMLElement) => number;
  getPreference: (element: HTMLElement) => number;
};

const createHintCollectionContext = (): HintCollectionContext => {
  const rectCache = new WeakMap<HTMLElement, DOMRect | null>();
  const identityCache = new WeakMap<HTMLElement, string | null>();
  const depthCache = new WeakMap<HTMLElement, number>();
  const preferenceCache = new WeakMap<HTMLElement, number>();

  const getRect = (element: HTMLElement): DOMRect | null => {
    if (rectCache.has(element)) {
      return rectCache.get(element) ?? null;
    }

    const rect = getMarkerRect(element);
    rectCache.set(element, rect);
    return rect;
  };

  const getIdentity = (element: HTMLElement): string | null => {
    if (identityCache.has(element)) {
      return identityCache.get(element) ?? null;
    }

    const identity = getHintIdentity(element);
    identityCache.set(element, identity);
    return identity;
  };

  const getDepth = (element: HTMLElement): number => {
    const cachedDepth = depthCache.get(element);
    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    const depth = getDomDepth(element);
    depthCache.set(element, depth);
    return depth;
  };

  const getPreference = (element: HTMLElement): number => {
    const cachedPreference = preferenceCache.get(element);
    if (cachedPreference !== undefined) {
      return cachedPreference;
    }

    const preference = getHintTargetPreference(element);
    preferenceCache.set(element, preference);
    return preference;
  };

  return {
    getRect,
    getIdentity,
    getDepth,
    getPreference
  };
};

const isEligibleHintTarget = (element: HTMLElement, mode: LinkMode): boolean => {
  if (mode === "copy-image") {
    return (
      element instanceof HTMLImageElement &&
      !!(element.currentSrc || element.src) &&
      isVisibleHintTarget(element)
    );
  }

  return isHintable(element);
};

const getHintableElements = (mode: LinkMode): HTMLElement[] => {
  const selector = getHintSelector(mode);
  const { getRect, getIdentity, getDepth, getPreference } = createHintCollectionContext();
  const elements: HTMLElement[] = [];

  for (const element of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    if (isEligibleHintTarget(element, mode)) {
      elements.push(element);
    }
  }

  const candidateSet = new Set(elements);
  const withoutEquivalentAncestors = elements.filter(
    (element) => !hasEquivalentAncestorTarget(element, candidateSet, getRect)
  );
  const uniqueElements = dedupeHintTargets(
    withoutEquivalentAncestors,
    getRect,
    getIdentity,
    getPreference
  );

  uniqueElements.sort((leftElement, rightElement) => {
    const leftRect = getRect(leftElement);
    const rightRect = getRect(rightElement);

    if (!leftRect || !rightRect) return 0;
    if (leftRect.top !== rightRect.top) return leftRect.top - rightRect.top;
    if (leftRect.left !== rightRect.left) return leftRect.left - rightRect.left;
    return getDepth(leftElement) - getDepth(rightElement);
  });

  return uniqueElements;
};

const serializeBlockedPairs = (
  blockedPairs: Partial<Record<string, Partial<Record<string, true>>>>
): string => {
  const entries: string[] = [];

  for (const left of Object.keys(blockedPairs).sort()) {
    const rights = Object.keys(blockedPairs[left] ?? {})
      .filter((right) => blockedPairs[left]?.[right] === true)
      .sort();

    if (rights.length > 0) {
      entries.push(`${left}>${rights.join(",")}`);
    }
  }

  return entries.join("|");
};

const getLabelPlanCacheKey = (
  count: number,
  reservedLabels: string[],
  blockedPairs: Partial<Record<string, Partial<Record<string, true>>>>
): string => {
  return [
    count,
    reservedLabels.join(","),
    minHintLabelLength,
    hintAlphabet,
    Array.from(reservedHintPrefixes).sort().join(","),
    serializeBlockedPairs(blockedPairs)
  ].join("::");
};

type BlockedPairs = Partial<Record<string, Partial<Record<string, true>>>>;

const buildHintLabels = (
  count: number,
  reservedLabels: string[] = []
): { labelLength: number; labels: string[] } => {
  if (count <= 0) {
    return { labelLength: 0, labels: [] };
  }

  const buildLabelsForBlockedPairs = (
    blockedPairs: BlockedPairs
  ): { labelLength: number; labels: string[] } => {
    const cacheKey = getLabelPlanCacheKey(count, reservedLabels, blockedPairs);
    const cachedPlan = labelPlanCache.get(cacheKey);

    if (cachedPlan) {
      return {
        labelLength: cachedPlan.labelLength,
        labels: [...cachedPlan.labels]
      };
    }

    const alphabet = hintAlphabet.split("");
    const firstCharacters = alphabet.filter((char) => !reservedHintPrefixes.has(char));
    const leadingAlphabet = firstCharacters.length > 0 ? firstCharacters : alphabet;
    const subtreeCapacityCache = new Map<string, number>();
    const labels: string[] = [];

    const getAllowedChars = (
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

      for (const char of getAllowedChars(previousChar, isLeadingCharacter)) {
        subtreeCapacity += getSubtreeCapacity(char, remainingLength - 1, false);
      }

      subtreeCapacityCache.set(cacheKey, subtreeCapacity);
      return subtreeCapacity;
    };

    const distributeLabels = (
      prefix: string,
      previousChar: string | null,
      remainingCount: number,
      remainingLength: number,
      isLeadingCharacter: boolean
    ): void => {
      if (remainingCount <= 0) return;

      const sourceAlphabet = getAllowedChars(previousChar, isLeadingCharacter);
      let assignedCount = 0;

      for (let index = 0; index < sourceAlphabet.length; index += 1) {
        const char = sourceAlphabet[index]!;
        const nextLabel = `${prefix}${char}`;
        const remainingBuckets = sourceAlphabet.length - index;
        const nextRemainingCount = remainingCount - assignedCount;
        const subtreeCapacity = getSubtreeCapacity(char, remainingLength - 1, false);
        const bucketCount = Math.min(
          subtreeCapacity,
          Math.ceil(nextRemainingCount / remainingBuckets)
        );

        if (bucketCount <= 0) continue;

        if (
          remainingLength === 1 &&
          doesLabelConflictWithReservedLabels(nextLabel, reservedLabels)
        ) {
          continue;
        }

        if (remainingLength === 1) {
          labels.push(nextLabel);
        } else {
          distributeLabels(nextLabel, char, bucketCount, remainingLength - 1, false);
        }

        assignedCount += bucketCount;
        if (assignedCount >= remainingCount || labels.length >= count) return;
      }
    };

    let labelLength = minHintLabelLength;
    let capacity = getSubtreeCapacity(null, labelLength, true);
    while (capacity < count) {
      const nextLength = labelLength + 1;
      const nextCapacity = getSubtreeCapacity(null, nextLength, true);

      if (nextCapacity <= capacity) {
        const result = { labelLength, labels: [] };
        labelPlanCache.set(cacheKey, result);
        return result;
      }

      labelLength = nextLength;
      capacity = nextCapacity;
    }

    distributeLabels("", null, count, labelLength, true);

    if (labels.length > count) {
      labels.length = count;
    }

    const result = {
      labelLength,
      labels: labels.slice(0, count - reservedLabels.length)
    };
    labelPlanCache.set(cacheKey, result);
    return result;
  };

  const labels = buildLabelsForBlockedPairs(avoidedAdjacentHintPairs);
  if (labels.labels.length === count - reservedLabels.length) {
    return labels;
  }

  return buildLabelsForBlockedPairs({});
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

const HOME_ATTRIBUTE_PATTERNS = [/\bhome\b/i, /\bhomepage\b/i];

const HOME_LOGO_PATTERNS = [/\blogo\b/i, /\bbrand\b/i];
const HOME_PATHS = new Set(["/", "/home", "/homepage", "/dashboard"]);
const RESERVED_LABEL_PATTERN = /^[a-z]+$/;

const getElementTextContent = (element: HTMLElement): string =>
  element.textContent?.replace(/\s+/g, " ").trim() ?? "";

const getJoinedAttributeText = (
  element: HTMLElement,
  attributeNames: string[],
  extras: string[] = []
): string =>
  [...attributeNames.map((name) => element.getAttribute(name)), ...extras]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");

const textMatchesAnyPattern = (text: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

const getNormalizedSameOriginPath = (href: string): string | null => {
  try {
    const resolvedUrl = new URL(href, window.location.href);
    if (resolvedUrl.origin !== window.location.origin) {
      return null;
    }

    return resolvedUrl.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
};

const getSearchCandidateScore = (element: HTMLElement): number => {
  if (!isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = getMarkerRect(element);
  if (!rect) return Number.NEGATIVE_INFINITY;

  let score = 100;
  const attributeText = getJoinedAttributeText(element, [
    "type",
    "name",
    "id",
    "placeholder",
    "aria-label",
    "data-testid",
    "role"
  ]);

  if (textMatchesAnyPattern(attributeText, SEARCH_ATTRIBUTE_PATTERNS)) {
    score += 120;
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
  const selectableElementIndexes = elements.flatMap((element, index) =>
    isSelectableElement(element) ? [index] : []
  );

  if (selectableElementIndexes.length === 1) {
    return selectableElementIndexes[0] ?? null;
  }

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

const getHomeCandidateScore = (element: HTMLElement): number => {
  if (
    !(
      element instanceof HTMLAnchorElement ||
      element instanceof HTMLAreaElement ||
      element instanceof HTMLButtonElement ||
      hasInteractiveRole(element) ||
      element.hasAttribute("onclick")
    )
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = getMarkerRect(element);
  if (!rect) return Number.NEGATIVE_INFINITY;

  let score = 0;
  let hasStrongSignal = false;
  const textContent = getElementTextContent(element);
  const logoText = getJoinedAttributeText(element, [
    "id",
    "class",
    "data-testid",
    "aria-label",
    "title"
  ]);
  const hasLogoSignal = textMatchesAnyPattern(logoText, HOME_LOGO_PATTERNS);
  const attributeText = getJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "role", "title", "class"],
    [textContent]
  );

  if (textMatchesAnyPattern(attributeText, HOME_ATTRIBUTE_PATTERNS)) {
    score += 220;
    hasStrongSignal = true;
  }

  const href = element.getAttribute("href");
  if (href) {
    const normalizedPath = getNormalizedSameOriginPath(href);
    if (normalizedPath && HOME_PATHS.has(normalizedPath)) {
      score += 220;
      hasStrongSignal = true;

      if (normalizedPath === "/" && hasLogoSignal) {
        score += 260;
      }
    }
  }

  const relValue = element.getAttribute("rel")?.toLowerCase() ?? "";
  if (relValue.split(/\s+/).includes("home")) {
    score += 180;
    hasStrongSignal = true;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  if (element.getAttribute("aria-current")?.toLowerCase() === "page") {
    score += 40;
  }

  if (element.closest("nav, header, [role='navigation']")) {
    score += 40;
  }

  score += Math.min(220, rect.width) / 8;
  score += Math.min(120, rect.height) / 12;

  return score;
};

const getPreferredHomeElementIndex = (elements: HTMLElement[]): number | null => {
  let bestIndex: number | null = null;
  let bestScore = 180;

  elements.forEach((element, index) => {
    const score = getHomeCandidateScore(element);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const isPreferredLabelValid = (label: string): boolean => {
  return label.length > 0 && RESERVED_LABEL_PATTERN.test(label);
};

const doesLabelConflictWithReservedLabels = (label: string, reservedLabels: string[]): boolean =>
  reservedLabels.some(
    (reservedLabel) => label.startsWith(reservedLabel) || reservedLabel.startsWith(label)
  );

const getPreferredReservedLabel = (labels: string[]): string | null => {
  for (const candidateLabel of labels) {
    if (isPreferredLabelValid(candidateLabel)) {
      return candidateLabel;
    }
  }

  return null;
};

const getPreferredSearchLabel = (): string | null => {
  return getPreferredReservedLabel(reservedHintLabels.search);
};

const getPreferredHomeLabel = (): string | null => {
  return getPreferredReservedLabel(reservedHintLabels.home);
};

const createOverlay = (): HTMLDivElement => {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing instanceof HTMLDivElement) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute(MARKER_ATTRIBUTE, "true");
  overlay.setAttribute("aria-hidden", "true");

  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.pointerEvents = "none";

  return overlay;
};

const getDefaultHintMarkerCSS = (): string => {
  const markerSelector = `[${MARKER_STYLE_ATTRIBUTE}]`;
  const thumbnailMarkerSelector = `[${MARKER_VARIANT_STYLE_ATTRIBUTE}="thumbnail"]`;
  const pendingSelector = `[${LETTER_STYLE_ATTRIBUTE}="pending"]`;
  const typedSelector = `[${LETTER_STYLE_ATTRIBUTE}="typed"]`;

  return `${markerSelector}{transform:translate(-20%,-20%);transition:none !important;transition-duration:0ms !important;transition-property:none !important;padding:1px 4px;border-radius:3px;background:#eab308;color:#2b1d00;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:12px;font-weight:700;letter-spacing:.08em;line-height:1.2;box-shadow:0 1px 3px rgba(0,0,0,.28);white-space:nowrap;}${thumbnailMarkerSelector}{transform:translate(0,0);padding:4px 10px;border-radius:6px;font-size:18px;font-weight:800;letter-spacing:.12em;line-height:1.1;box-shadow:0 3px 10px rgba(0,0,0,.4);}${pendingSelector}{color:#000000;}${typedSelector}{color:#ffffff;}`;
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

const setMarkerTypedState = (hint: HintMarker, typed: string): void => {
  if (hint.renderedTyped === typed) {
    return;
  }

  const typedLength = typed.length;
  const previousTypedLength = hint.renderedTyped.length;
  const startIndex = Math.min(typedLength, previousTypedLength);
  const endIndex = Math.max(typedLength, previousTypedLength);

  for (let index = startIndex; index < endIndex; index += 1) {
    const letter = hint.letters[index];
    if (!letter) continue;

    const isTyped = index < typedLength;
    letter.setAttribute(LETTER_ATTRIBUTE, isTyped ? "typed" : "pending");
    letter.setAttribute(LETTER_STYLE_ATTRIBUTE, isTyped ? "typed" : "pending");
  }

  hint.renderedTyped = typed;
};

const createMarker = (label: string): Pick<HintMarker, "marker" | "letters" | "renderedTyped"> => {
  const marker = document.createElement("span");
  marker.setAttribute(MARKER_ATTRIBUTE, "true");
  marker.setAttribute(MARKER_STYLE_ATTRIBUTE, "true");
  marker.setAttribute(MARKER_VARIANT_STYLE_ATTRIBUTE, "default");
  marker.setAttribute("aria-hidden", "true");

  marker.style.position = "fixed";
  marker.style.left = "0px";
  marker.style.top = "0px";

  const displayLabel = showCapitalizedLetters ? label.toUpperCase() : label.toLowerCase();
  const letters: HTMLSpanElement[] = [];

  for (const char of Array.from(displayLabel)) {
    const letter = document.createElement("span");
    letter.textContent = char;
    letter.setAttribute(LETTER_ATTRIBUTE, "pending");
    letter.setAttribute(LETTER_STYLE_ATTRIBUTE, "pending");
    marker.appendChild(letter);
    letters.push(letter);
  }

  return { marker, letters, renderedTyped: "" };
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

const getRectArea = (rect: Pick<DOMRect, "width" | "height">): number =>
  Math.max(0, rect.width) * Math.max(0, rect.height);

const hasThumbnailKeyword = (value: string | null | undefined): boolean =>
  !!value && /(thumbnail|thumb|poster|preview|cover)/i.test(value);

const hasNonThumbnailMediaKeyword = (value: string | null | undefined): boolean =>
  !!value && /(logo|icon|avatar|badge|brand|wordmark)/i.test(value);

const THUMBNAIL_SELECTOR = [
  "img",
  "picture",
  "video",
  "canvas",
  "[role='img']",
  "[data-thumbnail]",
  "[id*='thumbnail']",
  "[class*='thumbnail']",
  "[data-testid*='thumbnail']",
  "yt-thumbnail-view-model",
  "ytd-thumbnail"
].join(", ");

const hasExplicitThumbnailSignal = (element: HTMLElement): boolean =>
  hasThumbnailKeyword(element.id) ||
  hasThumbnailKeyword(element.className) ||
  hasThumbnailKeyword(element.tagName) ||
  hasThumbnailKeyword(element.getAttribute("data-testid")) ||
  hasThumbnailKeyword(element.getAttribute("data-e2e")) ||
  hasThumbnailKeyword(element.getAttribute("data-thumbnail")) ||
  hasThumbnailKeyword(element.getAttribute("aria-label")) ||
  hasThumbnailKeyword(element.getAttribute("title"));

const hasNonThumbnailMediaSignal = (element: HTMLElement): boolean =>
  hasNonThumbnailMediaKeyword(element.id) ||
  hasNonThumbnailMediaKeyword(element.className) ||
  hasNonThumbnailMediaKeyword(element.tagName) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("data-testid")) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("data-e2e")) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("aria-label")) ||
  hasNonThumbnailMediaKeyword(element.getAttribute("title"));

const isImplicitThumbnailElement = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();

  return (
    tagName === "img" ||
    tagName === "picture" ||
    tagName === "video" ||
    tagName === "canvas" ||
    element.getAttribute("role")?.toLowerCase() === "img"
  );
};

const getThumbnailRects = (element: HTMLElement): DOMRect[] => {
  const thumbnailElements = [
    element,
    ...Array.from(element.querySelectorAll<HTMLElement>(THUMBNAIL_SELECTOR))
  ].filter((candidate, index, candidates): candidate is HTMLElement => {
    return candidate instanceof HTMLElement && candidates.indexOf(candidate) === index;
  });

  const rects: DOMRect[] = [];

  for (const thumbnailElement of thumbnailElements) {
    const rect = getMarkerRect(thumbnailElement);

    if (rect) {
      rects.push(rect);
    }
  }

  return rects;
};

const getPreferredThumbnailRect = (element: HTMLElement, targetRect: DOMRect): DOMRect | null => {
  const targetArea = getRectArea(targetRect);

  if (targetArea === 0) {
    return null;
  }

  const thumbnailRects = getThumbnailRects(element)
    .filter((rect) => rect.width >= MIN_THUMBNAIL_WIDTH && rect.height >= MIN_THUMBNAIL_HEIGHT)
    .filter((rect) => getRectArea(rect) / targetArea >= MIN_THUMBNAIL_MEDIA_AREA_RATIO)
    .sort((leftRect, rightRect) => getRectArea(rightRect) - getRectArea(leftRect));

  return thumbnailRects[0] ?? null;
};

const isThumbnailLikeTarget = (element: HTMLElement, targetRect: DOMRect): boolean => {
  if (!highlightThumbnails) {
    return false;
  }

  if (targetRect.width < MIN_THUMBNAIL_WIDTH || targetRect.height < MIN_THUMBNAIL_HEIGHT) {
    return false;
  }

  const thumbnailRect = getPreferredThumbnailRect(element, targetRect);

  if (!thumbnailRect) {
    return false;
  }

  const thumbnailElements = [
    element,
    ...Array.from(element.querySelectorAll<HTMLElement>(THUMBNAIL_SELECTOR))
  ].filter((candidate, index, candidates): candidate is HTMLElement => {
    return candidate instanceof HTMLElement && candidates.indexOf(candidate) === index;
  });

  const hasExplicitSignal = thumbnailElements.some((mediaElement) =>
    hasExplicitThumbnailSignal(mediaElement)
  );

  if (hasExplicitSignal) {
    return true;
  }

  if (thumbnailElements.some((mediaElement) => hasNonThumbnailMediaSignal(mediaElement))) {
    return false;
  }

  if (!thumbnailElements.some((mediaElement) => isImplicitThumbnailElement(mediaElement))) {
    return false;
  }

  return thumbnailRect.width / thumbnailRect.height >= MIN_THUMBNAIL_ASPECT_RATIO;
};

const shouldUseThumbnailMarker = (element: HTMLElement, targetRect: DOMRect): boolean => {
  if (!highlightThumbnails) {
    return false;
  }

  if (hintState.mode === "copy-image" && element instanceof HTMLImageElement) {
    return (
      targetRect.width >= MIN_COPY_IMAGE_THUMBNAIL_WIDTH &&
      targetRect.height >= MIN_COPY_IMAGE_THUMBNAIL_HEIGHT
    );
  }

  return isThumbnailLikeTarget(element, targetRect);
};

const getMarkerPositionCandidates = (
  anchorRect: RectLike,
  shouldHighlightThumbnail: boolean,
  markerWidth: number,
  markerHeight: number
): Array<Pick<PlacedMarkerRect, "left" | "top">> => {
  const candidates: Array<Pick<PlacedMarkerRect, "left" | "top">> = [];
  const seen = new Set<string>();
  const pushCandidate = (left: number, top: number): void => {
    const clamped = clampMarkerPosition(left, top, markerWidth, markerHeight);
    const key = `${Math.round(clamped.left)}:${Math.round(clamped.top)}`;

    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(clamped);
  };

  const left = anchorRect.left + MARKER_ANCHOR_INSET;
  const top = anchorRect.top + MARKER_ANCHOR_INSET;
  const right = Math.max(anchorRect.left, anchorRect.right - markerWidth - MARKER_ANCHOR_INSET);
  const bottom = Math.max(anchorRect.top, anchorRect.bottom - markerHeight - MARKER_ANCHOR_INSET);
  const centerLeft = anchorRect.left + (anchorRect.width - markerWidth) / 2;
  const centerTop = anchorRect.top + (anchorRect.height - markerHeight) / 2;

  if (shouldHighlightThumbnail) {
    pushCandidate(centerLeft, centerTop);
    pushCandidate(centerLeft, top);
    pushCandidate(left, centerTop);
  }

  pushCandidate(left, top);
  pushCandidate(right, top);
  pushCandidate(left, bottom);
  pushCandidate(right, bottom);
  pushCandidate(centerLeft, top);
  pushCandidate(left, centerTop);

  if (!shouldHighlightThumbnail) {
    pushCandidate(centerLeft, centerTop);
  }

  return candidates;
};

const getMarkerPlacementPlan = (
  element: HTMLElement,
  targetRect: DOMRect,
  markerWidth: number,
  markerHeight: number
): { variant: MarkerVariant; candidates: Array<Pick<PlacedMarkerRect, "left" | "top">> } => {
  const shouldHighlightThumbnail = shouldUseThumbnailMarker(element, targetRect);
  const anchorRect = shouldHighlightThumbnail
    ? (getPreferredThumbnailRect(element, targetRect) ?? targetRect)
    : targetRect;

  return {
    variant: shouldHighlightThumbnail ? "thumbnail" : "default",
    candidates: getMarkerPositionCandidates(
      anchorRect,
      shouldHighlightThumbnail,
      markerWidth,
      markerHeight
    )
  };
};

const getCollisionBucketKeys = (rect: PlacedMarkerRect): string[] => {
  const minX = Math.floor((rect.left - MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const maxX = Math.floor((rect.right + MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const minY = Math.floor((rect.top - MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const maxY = Math.floor((rect.bottom + MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const keys: string[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      keys.push(`${x}:${y}`);
    }
  }

  return keys;
};

const hasCollision = (
  collisionGrid: Map<string, PlacedMarkerRect[]>,
  nextRect: PlacedMarkerRect
): boolean => {
  for (const bucketKey of getCollisionBucketKeys(nextRect)) {
    const bucket = collisionGrid.get(bucketKey);
    if (!bucket) continue;

    for (const placedRect of bucket) {
      if (doPlacedMarkerRectsOverlap(placedRect, nextRect)) {
        return true;
      }
    }
  }

  return false;
};

const addToCollisionGrid = (
  collisionGrid: Map<string, PlacedMarkerRect[]>,
  rect: PlacedMarkerRect
): void => {
  for (const bucketKey of getCollisionBucketKeys(rect)) {
    const bucket = collisionGrid.get(bucketKey);

    if (bucket) {
      bucket.push(rect);
      continue;
    }

    collisionGrid.set(bucketKey, [rect]);
  }
};

const updateMarkerPositions = (): void => {
  const collisionGrid = new Map<string, PlacedMarkerRect[]>();

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
    const placementPlan = getMarkerPlacementPlan(
      hint.element,
      targetRect,
      markerWidth,
      markerHeight
    );
    hint.marker.setAttribute(MARKER_VARIANT_STYLE_ATTRIBUTE, placementPlan.variant);
    const nextMarkerRect = hint.marker.getBoundingClientRect();
    const adjustedWidth = Math.max(1, Math.round(nextMarkerRect.width));
    const adjustedHeight = Math.max(1, Math.round(nextMarkerRect.height));
    const candidates =
      adjustedWidth === markerWidth && adjustedHeight === markerHeight
        ? placementPlan.candidates
        : getMarkerPlacementPlan(hint.element, targetRect, adjustedWidth, adjustedHeight)
            .candidates;

    let chosenRect: PlacedMarkerRect | null = null;

    for (const candidate of candidates) {
      const nextRect = createPlacedMarkerRect(
        candidate.left,
        candidate.top,
        adjustedWidth,
        adjustedHeight
      );

      if (!hasCollision(collisionGrid, nextRect)) {
        chosenRect = nextRect;
        break;
      }
    }

    const fallbackPosition = clampMarkerPosition(
      targetRect.left,
      targetRect.top,
      adjustedWidth,
      adjustedHeight
    );
    const nextRect =
      chosenRect ??
      createPlacedMarkerRect(
        fallbackPosition.left,
        fallbackPosition.top,
        adjustedWidth,
        adjustedHeight
      );

    hint.marker.style.left = `${Math.round(nextRect.left)}px`;
    hint.marker.style.top = `${Math.round(nextRect.top)}px`;
    addToCollisionGrid(collisionGrid, nextRect);
  }
};

const getVideoHintContainer = (element: HTMLElement): HTMLElement | null => {
  if (element instanceof HTMLVideoElement) {
    return element;
  }

  let current: HTMLElement | null = element;

  while (current) {
    if (current.querySelector("video")) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

const revealVideoHintControls = (markers: HintMarker[]): void => {
  const seen = new Set<HTMLElement>();

  for (const { element } of markers) {
    const videoContainer = getVideoHintContainer(element);
    if (!videoContainer) continue;

    let current: HTMLElement | null = element;

    while (current) {
      if (!seen.has(current)) {
        seen.add(current);
        hintState.revealedVideoHoverElements.push({
          element: current,
          inlineStyle: current.getAttribute("style")
        });

        current.style.setProperty("opacity", "1", "important");
        current.style.setProperty("visibility", "visible", "important");
      }

      if (current === videoContainer) {
        break;
      }

      current = current.parentElement;
    }
  }
};

const restoreRevealedVideoHintControls = (): void => {
  for (const { element, inlineStyle } of hintState.revealedVideoHoverElements) {
    if (inlineStyle === null) {
      element.removeAttribute("style");
      continue;
    }

    element.setAttribute("style", inlineStyle);
  }

  hintState.revealedVideoHoverElements = [];
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

  restoreRevealedVideoHintControls();
  hintState.overlay?.remove();

  hintState.active = false;
  hintState.mode = "current-tab";
  hintState.typed = "";
  hintState.previousTyped = "";
  hintState.markers = [];
  hintState.visibleMarkers = [];
  hintState.markerByLabel.clear();
  hintState.overlay = null;
  hintState.onActivate = null;
};

const activateHint = (hint: HintMarker): void => {
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
  const typed = hintState.typed;
  const previousTyped = hintState.previousTyped;
  const isNarrowing = typed.startsWith(previousTyped);
  const candidateMarkers = isNarrowing ? hintState.visibleMarkers : hintState.markers;
  const nextVisibleMarkers =
    typed.length === 0
      ? hintState.markers
      : candidateMarkers.filter((hint) => hint.label.startsWith(typed));
  const nextVisibleSet = new Set(nextVisibleMarkers);

  for (const hint of candidateMarkers) {
    const shouldBeVisible = typed.length === 0 || nextVisibleSet.has(hint);

    if (shouldBeVisible) {
      if (!hint.visible) {
        hint.marker.style.display = "";
        hint.visible = true;
      }

      setMarkerTypedState(hint, typed);
      continue;
    }

    if (hint.visible) {
      hint.marker.style.display = "none";
      hint.visible = false;
    }

    if (hint.renderedTyped.length > 0) {
      setMarkerTypedState(hint, "");
    }
  }

  hintState.visibleMarkers = nextVisibleMarkers;
  hintState.previousTyped = typed;
  const exactMatch = hintState.markerByLabel.get(typed);

  if (exactMatch) {
    activateHint(exactMatch);
  }
};

export const activateHints = (
  mode: LinkMode,
  options: {
    onActivate?: (element: HTMLElement) => void;
  } = {}
): boolean => {
  exitHints();
  applyHintStyles();

  const elements = getHintableElements(mode);
  if (elements.length === 0) return false;

  const preferredSearchElementIndex = getPreferredSearchElementIndex(elements);
  const preferredHomeElementIndex = getPreferredHomeElementIndex(elements);
  const preferredLabelsByIndex = new Map<number, string>();

  if (preferredSearchElementIndex !== null) {
    const preferredSearchLabel = getPreferredSearchLabel();
    if (preferredSearchLabel) {
      preferredLabelsByIndex.set(preferredSearchElementIndex, preferredSearchLabel);
    }
  }

  if (preferredHomeElementIndex !== null) {
    const preferredHomeLabel = getPreferredHomeLabel();
    if (preferredHomeLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredHomeElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredHomeElementIndex, preferredHomeLabel);
      }
    }
  }

  const reservedLabelsByIndex = new Map<number, string>();
  const reservedLabels: string[] = [];

  for (const [index, label] of preferredLabelsByIndex.entries()) {
    if (doesLabelConflictWithReservedLabels(label, reservedLabels)) {
      continue;
    }

    reservedLabelsByIndex.set(index, label);
    reservedLabels.push(label);
  }

  const { labels } = buildHintLabels(elements.length, reservedLabels);
  const overlay = createOverlay();
  const markers: HintMarker[] = [];
  let labelIndex = 0;

  elements.forEach((element, index) => {
    const rect = getMarkerRect(element);
    if (!rect) return;

    const label = reservedLabelsByIndex.get(index) ?? labels[labelIndex++];

    if (!label) return;
    const { marker, letters, renderedTyped } = createMarker(label);

    overlay.appendChild(marker);
    markers.push({ element, marker, label, letters, visible: true, renderedTyped });
  });

  if (markers.length === 0) return false;

  document.documentElement.appendChild(overlay);

  hintState.active = true;
  hintState.mode = mode;
  hintState.typed = "";
  hintState.previousTyped = "";
  hintState.markers = markers;
  hintState.visibleMarkers = markers;
  hintState.markerByLabel = new Map(markers.map((marker) => [marker.label, marker]));
  hintState.overlay = overlay;
  hintState.onActivate = options.onActivate ?? null;
  revealVideoHintControls(markers);

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
  clearLabelPlanCache();

  if (hintState.active) {
    exitHints();
  }
};

export const setReservedHintPrefixes = (prefixes: Iterable<string>): void => {
  reservedHintPrefixes = new Set(prefixes);
  clearLabelPlanCache();

  if (hintState.active) {
    exitHints();
  }
};

export const setAvoidedAdjacentHintPairs = (
  pairs: Partial<Record<string, Partial<Record<string, true>>>>
): void => {
  avoidedAdjacentHintPairs = pairs;
  clearLabelPlanCache();

  if (hintState.active) {
    exitHints();
  }
};

export const setReservedHintLabels = (labels: { search: string[]; home: string[] }): void => {
  reservedHintLabels = {
    search: [...labels.search],
    home: [...labels.home]
  };

  if (hintState.active) {
    exitHints();
  }
};

export const setMinHintLabelLength = (value: number): void => {
  minHintLabelLength = Number.isInteger(value) && value >= 1 ? value : 2;
  clearLabelPlanCache();

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
    setMarkerTypedState(hint, isMatch ? hintState.typed : "");
    const displayLabel = showCapitalizedLetters
      ? hint.label.toUpperCase()
      : hint.label.toLowerCase();

    for (let index = 0; index < hint.letters.length; index += 1) {
      const letter = hint.letters[index];
      if (!letter) continue;
      letter.textContent = displayLabel[index] ?? "";
    }
  }
};

export const setHighlightThumbnails = (nextHighlightThumbnails: boolean): void => {
  highlightThumbnails = nextHighlightThumbnails;

  if (hintState.active) {
    schedulePositionUpdate();
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
    const matches = hintState.visibleMarkers;
    const exactMatch = hintState.markerByLabel.get(hintState.typed);

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
