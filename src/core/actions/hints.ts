import { getExtensionNamespace } from "~/src/utils/extension-id";
import { DEFAULT_HINT_CHARSET } from "~/src/utils/hotkeys";
import {
  getDeepActiveElement,
  isEditableElement,
  isSelectableElement
} from "~/src/core/utils/isEditableTarget";
import {
  getHintableElements,
  getMarkerRect,
  getPreferredHomeElementIndex,
  getPreferredSearchElementIndex,
  getPreferredSidebarElementIndex,
  restoreRevealedHintControls,
  revealElementForHintCollection,
  revealHoverHintControls
} from "~/src/core/actions/hint-recognition";
import type { LinkMode, RevealedHintElement } from "~/src/core/actions/hint-recognition";

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
let hintAlphabet = DEFAULT_HINT_CHARSET;
let reservedHintPrefixes = new Set<string>();
let avoidedAdjacentHintPairs: Partial<Record<string, Partial<Record<string, true>>>> = {};
let reservedHintLabels: {
  search: string[];
  home: string[];
  sidebar: string[];
} = {
  search: [],
  home: [],
  sidebar: []
};
let minHintLabelLength = 2;
let showCapitalizedLetters = true;
let highlightThumbnails = false;
let hintCSS = "";

type HintMarker = {
  element: HTMLElement;
  marker: HTMLSpanElement;
  label: string;
  letters: HTMLSpanElement[];
  visible: boolean;
  renderedTyped: string;
  markerWidth: number;
  markerHeight: number;
  sizeDirty: boolean;
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
  revealedHoverElements: RevealedHintElement[];
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
  revealedHoverElements: []
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

const RESERVED_LABEL_PATTERN = /^[a-z]+$/;

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

const getPreferredSidebarLabel = (): string | null => {
  return getPreferredReservedLabel(reservedHintLabels.sidebar);
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

const createMarker = (
  label: string
): Pick<
  HintMarker,
  "marker" | "letters" | "renderedTyped" | "markerWidth" | "markerHeight" | "sizeDirty"
> => {
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

  return {
    marker,
    letters,
    renderedTyped: "",
    markerWidth: 0,
    markerHeight: 0,
    sizeDirty: true
  };
};

const invalidateMarkerSize = (hint: HintMarker): void => {
  hint.markerWidth = 0;
  hint.markerHeight = 0;
  hint.sizeDirty = true;
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
  "[data-testid*='thumbnail']"
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

const collectUniqueThumbnailElements = (element: HTMLElement): HTMLElement[] => {
  const seen = new Set<HTMLElement>();
  seen.add(element);

  for (const candidate of Array.from(element.querySelectorAll<HTMLElement>(THUMBNAIL_SELECTOR))) {
    seen.add(candidate);
  }

  return Array.from(seen);
};

const getPreferredThumbnailRect = (
  targetRect: DOMRect,
  thumbnailElements: readonly HTMLElement[]
): DOMRect | null => {
  const targetArea = getRectArea(targetRect);

  if (targetArea === 0) {
    return null;
  }

  let bestRect: DOMRect | null = null;
  let bestArea = 0;

  for (const thumbnailElement of thumbnailElements) {
    const rect = getMarkerRect(thumbnailElement);
    if (!rect) continue;
    if (rect.width < MIN_THUMBNAIL_WIDTH || rect.height < MIN_THUMBNAIL_HEIGHT) continue;

    const area = getRectArea(rect);
    if (area / targetArea < MIN_THUMBNAIL_MEDIA_AREA_RATIO) continue;
    if (area <= bestArea) continue;

    bestArea = area;
    bestRect = rect;
  }

  return bestRect;
};

const isThumbnailLikeTarget = (
  targetRect: DOMRect,
  thumbnailElements: readonly HTMLElement[],
  preferredThumbnailRect: DOMRect | null
): boolean => {
  if (targetRect.width < MIN_THUMBNAIL_WIDTH || targetRect.height < MIN_THUMBNAIL_HEIGHT) {
    return false;
  }

  if (!preferredThumbnailRect) {
    return false;
  }

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

  return preferredThumbnailRect.width / preferredThumbnailRect.height >= MIN_THUMBNAIL_ASPECT_RATIO;
};

type MarkerPlacementInfo = {
  variant: MarkerVariant;
  anchorRect: DOMRect;
};

const getMarkerPlacementInfo = (element: HTMLElement, targetRect: DOMRect): MarkerPlacementInfo => {
  if (!highlightThumbnails) {
    return { variant: "default", anchorRect: targetRect };
  }

  const thumbnailElements = collectUniqueThumbnailElements(element);
  const preferredThumbnailRect = getPreferredThumbnailRect(targetRect, thumbnailElements);

  if (hintState.mode === "copy-image" && element instanceof HTMLImageElement) {
    const useThumbnail =
      targetRect.width >= MIN_COPY_IMAGE_THUMBNAIL_WIDTH &&
      targetRect.height >= MIN_COPY_IMAGE_THUMBNAIL_HEIGHT;
    return {
      variant: useThumbnail ? "thumbnail" : "default",
      anchorRect: useThumbnail ? (preferredThumbnailRect ?? targetRect) : targetRect
    };
  }

  const useThumbnail = isThumbnailLikeTarget(targetRect, thumbnailElements, preferredThumbnailRect);
  return {
    variant: useThumbnail ? "thumbnail" : "default",
    anchorRect: useThumbnail ? (preferredThumbnailRect ?? targetRect) : targetRect
  };
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

const getMarkerPlacementCandidates = (
  anchorRect: DOMRect,
  markerVariant: MarkerVariant,
  markerWidth: number,
  markerHeight: number
): Array<Pick<PlacedMarkerRect, "left" | "top">> => {
  return getMarkerPositionCandidates(
    anchorRect,
    markerVariant === "thumbnail",
    markerWidth,
    markerHeight
  );
};

const forEachCollisionBucket = (
  rect: PlacedMarkerRect,
  callback: (bucketKey: string) => void
): void => {
  const minX = Math.floor((rect.left - MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const maxX = Math.floor((rect.right + MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const minY = Math.floor((rect.top - MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);
  const maxY = Math.floor((rect.bottom + MARKER_COLLISION_GAP) / MARKER_COLLISION_CELL_SIZE);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      callback(`${x}:${y}`);
    }
  }
};

const hasCollision = (
  collisionGrid: Map<string, PlacedMarkerRect[]>,
  nextRect: PlacedMarkerRect
): boolean => {
  let collides = false;

  forEachCollisionBucket(nextRect, (bucketKey) => {
    if (collides) return;
    const bucket = collisionGrid.get(bucketKey);
    if (!bucket) return;

    for (const placedRect of bucket) {
      if (doPlacedMarkerRectsOverlap(placedRect, nextRect)) {
        collides = true;
        return;
      }
    }
  });

  return collides;
};

const addToCollisionGrid = (
  collisionGrid: Map<string, PlacedMarkerRect[]>,
  rect: PlacedMarkerRect
): void => {
  forEachCollisionBucket(rect, (bucketKey) => {
    const bucket = collisionGrid.get(bucketKey);

    if (bucket) {
      bucket.push(rect);
      return;
    }

    collisionGrid.set(bucketKey, [rect]);
  });
};

const updateMarkerPositions = (): void => {
  const collisionGrid = new Map<string, PlacedMarkerRect[]>();

  for (const hint of hintState.markers) {
    const targetRect = getMarkerRect(hint.element);

    if (!targetRect) {
      if (hint.marker.style.display !== "none") {
        hint.marker.style.display = "none";
      }
      continue;
    }

    if (hint.marker.style.display === "none") {
      hint.marker.style.display = "";
    }

    const { variant: markerVariant, anchorRect } = getMarkerPlacementInfo(hint.element, targetRect);
    if (hint.marker.getAttribute(MARKER_VARIANT_STYLE_ATTRIBUTE) !== markerVariant) {
      hint.marker.setAttribute(MARKER_VARIANT_STYLE_ATTRIBUTE, markerVariant);
      invalidateMarkerSize(hint);
    }

    if (hint.sizeDirty || hint.markerWidth <= 0 || hint.markerHeight <= 0) {
      const markerRect = hint.marker.getBoundingClientRect();
      hint.markerWidth = Math.max(1, Math.round(markerRect.width));
      hint.markerHeight = Math.max(1, Math.round(markerRect.height));
      hint.sizeDirty = false;
    }

    const markerWidth = hint.markerWidth;
    const markerHeight = hint.markerHeight;
    const candidates = getMarkerPlacementCandidates(
      anchorRect,
      markerVariant,
      markerWidth,
      markerHeight
    );

    let chosenRect: PlacedMarkerRect | null = null;

    for (const candidate of candidates) {
      const nextRect = createPlacedMarkerRect(
        candidate.left,
        candidate.top,
        markerWidth,
        markerHeight
      );

      if (!hasCollision(collisionGrid, nextRect)) {
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
        revealElementForHintCollection(current, seen, hintState.revealedHoverElements);
      }

      if (current === videoContainer) {
        break;
      }

      current = current.parentElement;
    }
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
    window.dispatchEvent(new CustomEvent(HINT_SELECTABLE_ACTIVATED_EVENT));
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
  revealHoverHintControls(mode, hintState.revealedHoverElements);

  const elements = getHintableElements(mode);
  if (elements.length === 0) {
    restoreRevealedHintControls(hintState.revealedHoverElements);
    return false;
  }

  const preferredSearchElementIndex = getPreferredSearchElementIndex(elements);
  const preferredHomeElementIndex = getPreferredHomeElementIndex(elements);
  const preferredSidebarElementIndex = getPreferredSidebarElementIndex(elements);
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

  if (preferredSidebarElementIndex !== null) {
    const preferredSidebarLabel = getPreferredSidebarLabel();
    if (preferredSidebarLabel) {
      const existingLabel = preferredLabelsByIndex.get(preferredSidebarElementIndex);
      if (!existingLabel) {
        preferredLabelsByIndex.set(preferredSidebarElementIndex, preferredSidebarLabel);
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
    const { marker, letters, renderedTyped, markerWidth, markerHeight, sizeDirty } =
      createMarker(label);

    overlay.appendChild(marker);
    markers.push({
      element,
      marker,
      label,
      letters,
      visible: true,
      renderedTyped,
      markerWidth,
      markerHeight,
      sizeDirty
    });
  });

  if (markers.length === 0) {
    restoreRevealedHintControls(hintState.revealedHoverElements);
    return false;
  }

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

export const setReservedHintLabels = (labels: {
  search: string[];
  home: string[];
  sidebar: string[];
}): void => {
  reservedHintLabels = {
    search: [...labels.search],
    home: [...labels.home],
    sidebar: [...labels.sidebar]
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
  hintCSS = nextHintCSS || getDefaultHintMarkerCSS();
  applyHintStyles();

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