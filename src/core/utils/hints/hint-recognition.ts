import { getDeepActiveElement, isSelectableElement } from "~/src/core/utils/is-editable-target";
import type { ReservedHintDirective as HintDirective } from "~/src/utils/hint-reserved-label-directives";

export type LinkMode = "current-tab" | "new-tab" | "copy-link" | "copy-image";

export type RevealedHintElement = {
  element: HTMLElement;
  inlineStyle: string | null;
};

type RectLike = Pick<DOMRect, "left" | "top" | "right" | "bottom" | "width" | "height">;

export const getMarkerRect = (element: HTMLElement): DOMRect | null => {
  let bestRect: DOMRect | null = null;

  for (const rect of Array.from(element.getClientRects())) {
    if (rect.width <= 0 || rect.height <= 0) continue;

    if (
      !bestRect ||
      rect.top < bestRect.top ||
      (rect.top === bestRect.top && rect.left < bestRect.left)
    ) {
      bestRect = rect;
    }
  }

  return bestRect;
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

type PointHitTestResult = "reachable" | "occluded" | "missing";

const getPointHitTestResult = (element: HTMLElement, x: number, y: number): PointHitTestResult => {
  const topElement = getTopElementAtPoint(x, y);

  if (!topElement) {
    return "missing";
  }

  return isComposedDescendant(element, topElement) || isComposedDescendant(topElement, element)
    ? "reachable"
    : "occluded";
};

const getClickablePointResults = (element: HTMLElement, rect: DOMRect): PointHitTestResult[] => {
  const points: Array<[number, number]> = [
    [rect.left + rect.width * 0.5, rect.top + rect.height * 0.5],
    [rect.left + 0.1, rect.top + 0.1],
    [rect.right - 0.1, rect.top + 0.1],
    [rect.left + 0.1, rect.bottom - 0.1],
    [rect.right - 0.1, rect.bottom - 0.1]
  ];

  return points.map(([x, y]) => getPointHitTestResult(element, x, y));
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

const isIntrinsicInteractiveElement = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "a" || tagName === "area") {
    return !!element.getAttribute("href");
  }

  return isClickableByTagName(element, tagName);
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

const getAssociatedFileInput = (element: HTMLElement): HTMLInputElement | null => {
  if (element instanceof HTMLInputElement && element.type.toLowerCase() === "file") {
    return element;
  }

  if (
    element instanceof HTMLLabelElement &&
    element.control instanceof HTMLInputElement &&
    element.control.type.toLowerCase() === "file"
  ) {
    return element.control;
  }

  const ancestorLabel = element.closest("label");
  if (
    ancestorLabel instanceof HTMLLabelElement &&
    ancestorLabel.control instanceof HTMLInputElement &&
    ancestorLabel.control.type.toLowerCase() === "file"
  ) {
    return ancestorLabel.control;
  }

  return null;
};

const dedupeEquivalentAttachTargets = (
  elements: HTMLElement[],
  getRect: (element: HTMLElement) => DOMRect | null,
  getPreference: (element: HTMLElement) => number
): HTMLElement[] => {
  const attachRepresentatives = new Map<HTMLInputElement, HTMLElement>();

  for (const element of elements) {
    const control = getAssociatedFileInput(element);
    if (!control) {
      continue;
    }

    const existing = attachRepresentatives.get(control);
    if (!existing) {
      attachRepresentatives.set(control, element);
      continue;
    }

    const elementScore = getAttachCandidateScore(element, getRect(element));
    const existingScore = getAttachCandidateScore(existing, getRect(existing));

    if (
      elementScore > existingScore ||
      (elementScore === existingScore && getPreference(element) > getPreference(existing))
    ) {
      attachRepresentatives.set(control, element);
    }
  }

  return elements.filter((element) => {
    const control = getAssociatedFileInput(element);
    if (!control) {
      return true;
    }

    return attachRepresentatives.get(control) === element;
  });
};

const areEquivalentSemanticTargets = (
  leftElement: HTMLElement,
  rightElement: HTMLElement,
  getRect: (element: HTMLElement) => DOMRect | null,
  getSemanticScore: (element: HTMLElement, rectOverride?: DOMRect | null) => number
): boolean => {
  const leftRect = getRect(leftElement);
  const rightRect = getRect(rightElement);
  if (!leftRect || !rightRect) {
    return false;
  }

  const intersectionWidth = Math.max(
    0,
    Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left)
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top)
  );
  const intersectionArea = intersectionWidth * intersectionHeight;
  const smallerArea = Math.max(
    1,
    Math.min(leftRect.width * leftRect.height, rightRect.width * rightRect.height)
  );

  if (!areRectsEquivalent(leftRect, rightRect) && intersectionArea / smallerArea < 0.75) {
    return false;
  }

  return (
    getSemanticScore(leftElement, leftRect) !== Number.NEGATIVE_INFINITY &&
    getSemanticScore(rightElement, rightRect) !== Number.NEGATIVE_INFINITY
  );
};

const dedupeEquivalentSemanticTargets = (
  elements: HTMLElement[],
  getRect: (element: HTMLElement) => DOMRect | null,
  getPreference: (element: HTMLElement) => number,
  getSemanticScore: (element: HTMLElement, rectOverride?: DOMRect | null) => number
): HTMLElement[] => {
  const deduped: HTMLElement[] = [];

  for (const element of elements) {
    const duplicateIndex = deduped.findIndex((candidate) =>
      areEquivalentSemanticTargets(candidate, element, getRect, getSemanticScore)
    );

    if (duplicateIndex === -1) {
      deduped.push(element);
      continue;
    }

    const existing = deduped[duplicateIndex];
    if (!existing) {
      deduped.push(element);
      continue;
    }

    const elementRect = getRect(element);
    const existingRect = getRect(existing);
    const elementScore = getSemanticScore(element, elementRect);
    const existingScore = getSemanticScore(existing, existingRect);

    if (
      elementScore > existingScore ||
      (elementScore === existingScore && getPreference(element) > getPreference(existing))
    ) {
      deduped[duplicateIndex] = element;
    }
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
  const hasInteractiveState = hasInteractiveAriaState(element) || hasInteractiveDataState(element);

  if (hasInteractiveRole(element)) {
    if (isFocusable || isEditableHintTarget(element) || hasInteractiveState) {
      return true;
    }

    return window.getComputedStyle(element).cursor === "pointer";
  }

  if (hasDirectActionAttribute(element)) {
    if (isFocusable || hasInteractiveState) {
      return true;
    }

    return window.getComputedStyle(element).cursor === "pointer";
  }

  if (!isFocusable) {
    return false;
  }

  if (hasInteractiveState) {
    return true;
  }

  return window.getComputedStyle(element).cursor === "pointer";
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
  const rect = getMarkerRect(element);
  if (!rect) {
    return false;
  }

  if (
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > window.innerHeight ||
    rect.left > window.innerWidth
  ) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse" ||
    Number.parseFloat(style.opacity) === 0 ||
    style.pointerEvents === "none"
  ) {
    return false;
  }

  const clickablePointResults = getClickablePointResults(element, rect);

  if (clickablePointResults.includes("reachable")) {
    return true;
  }

  if (!isIntrinsicInteractiveElement(element)) {
    return false;
  }

  return !clickablePointResults.includes("occluded");
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
export const HINT_SELECTORS_DEFAULT = [
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

const HOVER_HINT_CONTAINER_SELECTOR = ["[data-playbutton='hover']", "[data-actions='hover']"].join(
  ","
);
const HOVER_HINT_INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "[role]",
  "[tabindex]",
  "[onclick]",
  "[jsaction]"
].join(",");
const HOVER_HINT_PLAY_CONTROL_PATTERNS = [/\bplay\b/i, /\bpause\b/i, /\bresume\b/i, /\bpreview\b/i];

const getHintSelector = (mode: LinkMode): string => {
  if (mode === "copy-link" || mode === "new-tab") {
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

export const getHintableElements = (mode: LinkMode): HTMLElement[] => {
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
  const uniqueElements = dedupeEquivalentAttachTargets(
    dedupeEquivalentSemanticTargets(
      dedupeHintTargets(withoutEquivalentAncestors, getRect, getIdentity, getPreference),
      getRect,
      getPreference,
      getAttachCandidateScore
    ),
    getRect,
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

const INPUT_ATTRIBUTE_PATTERNS = [
  /search/i,
  /find/i,
  /query/i,
  /prompt/i,
  /ask/i,
  /chat/i,
  /message/i,
  /composer/i
];
const ATTACH_ATTRIBUTE_PATTERNS = [
  /\battach\b/i,
  /\bupload\b/i,
  /\badd\b.*\bfiles?\b/i,
  /\bfiles?\b/i,
  /\battachments?\b/i,
  /\bdocument\b/i,
  /\bbrowse\b/i,
  /\bchoose\b/i,
  /\bcomposer\b/i,
  /\bcomposer[-_ ]?plus\b/i
];
const ATTACH_EXACT_CONTROL_PATTERNS = [
  /\bcomposer-plus-btn\b/i,
  /\badd files and more\b/i,
  /\bupload files?\b/i
];
const ATTACH_FILE_TYPE_PATTERNS = [/\bimage\b/i, /\bphoto\b/i, /\bmedia\b/i];

const HOME_ATTRIBUTE_PATTERNS = [/\bhome\b/i, /\bhomepage\b/i];
const SIDEBAR_ATTRIBUTE_PATTERNS = [
  /\bmenu\b/i,
  /\bhamburger\b/i,
  /\bnavigation\b/i,
  /\bsidebar\b/i,
  /\bside-nav\b/i,
  /\bsidenav\b/i,
  /\bnavigation rail\b/i,
  /\bdrawer\b/i
];
const SIDEBAR_CONTAINER_PATTERNS = [/\bsidebar\b/i, /\bside-nav\b/i, /\bsidenav\b/i, /\bdrawer\b/i];
const SIDEBAR_OPEN_CLOSE_PATTERNS = [
  /\bopen\s+sidebar\b/i,
  /\bclose\s+sidebar\b/i,
  /\bopen\s+drawer\b/i,
  /\bclose\s+drawer\b/i,
  /\bcollapse\b.*\bsidebar\b/i,
  /\bexpand\b.*\bsidebar\b/i,
  /\bclose-sidebar-button\b/i,
  /\bopen-sidebar-button\b/i
];
const SIDEBAR_NON_NAVIGATION_PATTERNS = [
  /\bprofile\b/i,
  /\baccount\b/i,
  /\buser\b/i,
  /\bavatar\b/i
];
const SIDEBAR_TOGGLE_PATTERNS = [
  /\bguide\b/i,
  /\bguide-button\b/i,
  /\bmenu\b/i,
  /\bmenu-button\b/i,
  /\bnav-toggle\b/i,
  /\bsidebar-toggle\b/i,
  /\bdrawer-toggle\b/i
];
const NEXT_ATTRIBUTE_PATTERNS = [/\bnext\b/i, /\bnewer\b/i];
const NEXT_SHORT_TEXT_PATTERNS = [/^more$/i, /^continue$/i, /^next$/i, /^next page$/i];
const NEXT_STRONG_ATTRIBUTE_PATTERNS = [
  /^next$/i,
  /^next\b/i,
  /\bnext page\b/i,
  /\bnext video\b/i,
  /\bplay next\b/i,
  /\bskip\b.*\bnext\b/i
];
const NEXT_FALSE_POSITIVE_PATTERNS = [
  /\bsign\s*in\b/i,
  /\blog\s*in\b/i,
  /\blog\s*on\b/i,
  /\bservice ?login\b/i,
  /\bauth\b/i,
  /\baccount\b/i,
  /\bregister\b/i,
  /\bjoin\b/i
];
const NOISY_NEXT_CLASS_PATTERNS = [/\byt-spec-button-shape-next\b/i, /\bbutton-next\b/i];
const PREV_ATTRIBUTE_PATTERNS = [/\bprev\b/i, /\bprevious\b/i, /\bolder\b/i];
const PREV_SHORT_TEXT_PATTERNS = [/^back$/i, /^previous$/i, /^previous page$/i, /^prev$/i];
const CANCEL_ATTRIBUTE_PATTERNS = [/\bcancel\b/i, /\bclose\b/i, /\bdismiss\b/i, /\bexit\b/i];
const CANCEL_SHORT_TEXT_PATTERNS = [/^no$/i, /^nope$/i, /^not now$/i, /^never mind$/i];
const SUBMIT_ATTRIBUTE_PATTERNS = [
  /\bsubmit\b/i,
  /\bsave\b/i,
  /\bsend\b/i,
  /\bpost\b/i,
  /\bapply\b/i,
  /\bconfirm\b/i
];
const SUBMIT_SHORT_TEXT_PATTERNS = [/^ok$/i, /^done$/i, /^yes$/i, /^submit$/i];
const LIKE_ATTRIBUTE_PATTERNS = [/\blike\b/i, /\bupvote\b/i, /\bthumb[-_ ]?up\b/i];
const LIKE_SHORT_TEXT_PATTERNS = [/^like$/i];
const DISLIKE_ATTRIBUTE_PATTERNS = [/\bdislike\b/i, /\bdownvote\b/i, /\bthumb[-_ ]?down\b/i];
const DISLIKE_SHORT_TEXT_PATTERNS = [/^dislike$/i];

const HOME_LOGO_PATTERNS = [/\blogo\b/i, /\bbrand\b/i];
const HOME_PATHS = new Set(["/", "/home", "/homepage", "/dashboard"]);

const getElementTextContent = (element: HTMLElement): string =>
  element.textContent?.replace(/\s+/g, " ").trim() ?? "";

const isLikelyShortControlText = (value: string): boolean => {
  if (!value) {
    return false;
  }

  if (value.length > 24) {
    return false;
  }

  const wordCount = value.split(/\s+/).filter((part) => part.length > 0).length;
  return wordCount > 0 && wordCount <= 4;
};

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

const hasHoverPlayControlSignal = (element: HTMLElement): boolean => {
  const attributeText = getJoinedAttributeText(element, [
    "aria-label",
    "title",
    "data-testid",
    "data-test-id",
    "class",
    "name"
  ]);

  return textMatchesAnyPattern(attributeText, HOVER_HINT_PLAY_CONTROL_PATTERNS);
};

export const revealElementForHintCollection = (
  element: HTMLElement,
  seen: Set<HTMLElement>,
  revealedElements: RevealedHintElement[]
): void => {
  if (seen.has(element)) {
    return;
  }

  seen.add(element);
  revealedElements.push({
    element,
    inlineStyle: element.getAttribute("style")
  });

  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === "none") {
    element.style.setProperty("display", "revert", "important");
  }

  element.style.setProperty("opacity", "1", "important");
  element.style.setProperty("visibility", "visible", "important");
  element.style.setProperty("pointer-events", "auto", "important");
};

export const revealHoverHintControls = (
  mode: LinkMode,
  revealedElements: RevealedHintElement[]
): void => {
  if (mode === "copy-link" || mode === "copy-image") {
    return;
  }

  const seen = new Set<HTMLElement>();

  for (const container of Array.from(
    document.querySelectorAll<HTMLElement>(HOVER_HINT_CONTAINER_SELECTOR)
  )) {
    for (const candidate of Array.from(
      container.querySelectorAll<HTMLElement>(HOVER_HINT_INTERACTIVE_SELECTOR)
    )) {
      if (!isActivatableElement(candidate) || !hasHoverPlayControlSignal(candidate)) {
        continue;
      }

      let current: HTMLElement | null = candidate;

      while (current && container.contains(current)) {
        revealElementForHintCollection(current, seen, revealedElements);

        if (current === container) {
          break;
        }

        current = current.parentElement;
      }
    }
  }
};

export const restoreRevealedHintControls = (revealedElements: RevealedHintElement[]): void => {
  for (const { element, inlineStyle } of revealedElements) {
    if (inlineStyle === null) {
      element.removeAttribute("style");
      continue;
    }

    element.setAttribute("style", inlineStyle);
  }

  revealedElements.length = 0;
};

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

const getInputCandidateScore = (element: HTMLElement, rectOverride?: DOMRect | null): number => {
  if (!isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
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

  if (textMatchesAnyPattern(attributeText, INPUT_ATTRIBUTE_PATTERNS)) {
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

const getAttachAttributeText = (element: HTMLElement): string => {
  const textContent = getElementTextContent(element);
  return getJoinedAttributeText(
    element,
    ["type", "name", "id", "class", "placeholder", "aria-label", "title", "data-testid", "role"],
    [textContent]
  );
};

const getAttachPresentationPreference = (
  element: HTMLElement,
  rectOverride?: DOMRect | null
): number => {
  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = getHintTargetPreference(element);
  const attributeText = getAttachAttributeText(element);

  if (textMatchesAnyPattern(attributeText, ATTACH_EXACT_CONTROL_PATTERNS)) {
    score += 400;
  }

  if (element instanceof HTMLButtonElement) {
    score += 220;
  }

  if (isIntrinsicInteractiveElement(element)) {
    score += 140;
  }

  if (element.hasAttribute("aria-haspopup")) {
    score += 80;
  }

  if (element.hasAttribute("aria-label") || element.hasAttribute("title")) {
    score += 60;
  }

  score -= Math.min(400, rect.width * rect.height) / 20;
  return score;
};

const getAttachCandidateScore = (element: HTMLElement, rectOverride?: DOMRect | null): number => {
  if (!isActivatableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  // @attach should target upload affordances, not the main editable composer input.
  // Keep file inputs/labels eligible, but skip other selectable controls.
  if (
    isSelectableElement(element) &&
    !(element instanceof HTMLInputElement && element.type.toLowerCase() === "file")
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) return Number.NEGATIVE_INFINITY;

  let score = 0;
  let hasStrongSignal = false;
  const attributeText = getAttachAttributeText(element);

  if (textMatchesAnyPattern(attributeText, ATTACH_ATTRIBUTE_PATTERNS)) {
    score += 260;
    hasStrongSignal = true;
  }

  if (textMatchesAnyPattern(attributeText, ATTACH_EXACT_CONTROL_PATTERNS)) {
    score += 240;
    hasStrongSignal = true;
  }

  // Treat file-type words as supporting evidence only. Generic thumbnail/image
  // controls often mention "image" or "media" without actually being upload
  // affordances, so they should not trigger @attach by themselves.
  if (textMatchesAnyPattern(attributeText, ATTACH_FILE_TYPE_PATTERNS)) {
    score += 60;
  }

  if (element instanceof HTMLInputElement && element.type.toLowerCase() === "file") {
    score += 320;
    hasStrongSignal = true;

    if (element.accept) {
      score += 120;
    }
  }

  if (
    element instanceof HTMLLabelElement &&
    element.control instanceof HTMLInputElement &&
    element.control.type.toLowerCase() === "file"
  ) {
    score += 340;
    hasStrongSignal = true;
  }

  if (element.closest("form")) {
    score += 60;
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLAnchorElement ||
    element instanceof HTMLAreaElement ||
    element.getAttribute("role")?.toLowerCase() === "button"
  ) {
    score += 40;
  }

  if (element.hasAttribute("aria-haspopup")) {
    score += 40;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += Math.min(220, rect.width) / 10;
  score += Math.min(120, rect.height) / 12;

  return score;
};

const getRectOverlapRatio = (leftRect: DOMRect, rightRect: DOMRect): number => {
  const intersectionWidth = Math.max(
    0,
    Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left)
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top)
  );
  const intersectionArea = intersectionWidth * intersectionHeight;
  const smallerArea = Math.max(
    1,
    Math.min(leftRect.width * leftRect.height, rightRect.width * rightRect.height)
  );

  return intersectionArea / smallerArea;
};

const getRectGapDistance = (leftRect: DOMRect, rightRect: DOMRect): number => {
  const horizontalGap = Math.max(
    0,
    leftRect.left - rightRect.right,
    rightRect.left - leftRect.right
  );
  const verticalGap = Math.max(0, leftRect.top - rightRect.bottom, rightRect.top - leftRect.bottom);

  return Math.hypot(horizontalGap, verticalGap);
};

const isLikelyHiddenFileInputControl = (
  element: HTMLElement,
  rectOverride?: DOMRect | null
): boolean => {
  if (!(element instanceof HTMLInputElement) || element.type.toLowerCase() !== "file") {
    return false;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const hiddenClassText = `${element.className} ${element.id}`;

  return (
    rect.width <= 4 ||
    rect.height <= 4 ||
    style.opacity === "0" ||
    style.clipPath !== "none" ||
    /\bsr-only\b|\bvisually-hidden\b|\bscreen-reader\b/i.test(hiddenClassText)
  );
};

const isRectCenterNearTarget = (
  targetRect: DOMRect,
  candidateRect: DOMRect,
  padding = 12
): boolean => {
  const centerX = candidateRect.left + candidateRect.width / 2;
  const centerY = candidateRect.top + candidateRect.height / 2;

  return (
    centerX >= targetRect.left - padding &&
    centerX <= targetRect.right + padding &&
    centerY >= targetRect.top - padding &&
    centerY <= targetRect.bottom + padding
  );
};

const remapAttachDirectiveIndex = (
  elements: HTMLElement[],
  attachIndex: number,
  getRect: (element: HTMLElement) => DOMRect | null
): number => {
  const attachElement = elements[attachIndex];
  if (!attachElement) {
    return attachIndex;
  }

  const attachRect = getRect(attachElement);
  if (!attachRect) {
    return attachIndex;
  }

  let bestIndex = attachIndex;
  let bestPreference = getAttachPresentationPreference(attachElement, attachRect);

  const shouldPreferVisibleProxy = isLikelyHiddenFileInputControl(attachElement, attachRect);

  elements.forEach((element, index) => {
    const score = getAttachCandidateScore(element, getRect(element));
    if (score === Number.NEGATIVE_INFINITY) {
      return;
    }

    const rect = getRect(element);
    if (!rect) {
      return;
    }

    const isNearbyVisibleProxy =
      shouldPreferVisibleProxy &&
      index !== attachIndex &&
      !isLikelyHiddenFileInputControl(element, rect) &&
      getRectGapDistance(attachRect, rect) <= 80;

    if (!isNearbyVisibleProxy && getRectOverlapRatio(attachRect, rect) < 0.7) {
      return;
    }

    const preference = getAttachPresentationPreference(element, rect);
    if (preference > bestPreference) {
      bestPreference = preference;
      bestIndex = index;
    }
  });

  return bestIndex;
};

export const getPreferredInputElementIndex = (elements: HTMLElement[]): number | null => {
  const selectableElementIndexes = elements.flatMap((element, index) =>
    isSelectableElement(element) ? [index] : []
  );

  if (selectableElementIndexes.length === 1) {
    return selectableElementIndexes[0] ?? null;
  }

  let bestIndex: number | null = null;
  let bestScore = 180;

  elements.forEach((element, index) => {
    const score = getInputCandidateScore(element);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

export const getPreferredSearchElementIndex = (elements: HTMLElement[]): number | null => {
  return getPreferredInputElementIndex(elements);
};

export const getPreferredAttachElementIndex = (elements: HTMLElement[]): number | null => {
  let bestIndex: number | null = null;
  let bestScore = 220;

  elements.forEach((element, index) => {
    const score = getAttachCandidateScore(element);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const getHomeCandidateScore = (element: HTMLElement, rectOverride?: DOMRect | null): number => {
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

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
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

export const getPreferredHomeElementIndex = (elements: HTMLElement[]): number | null => {
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

const getSidebarControlsSignalScore = (element: HTMLElement): number => {
  const controlsValue = element.getAttribute("aria-controls");
  if (!controlsValue) {
    return 0;
  }

  let score = 0;

  for (const controlId of controlsValue.split(/\s+/).map((part) => part.trim())) {
    if (!controlId) {
      continue;
    }

    if (textMatchesAnyPattern(controlId, SIDEBAR_CONTAINER_PATTERNS)) {
      score += 220;
    }

    const controlledElement = document.getElementById(controlId);
    if (!(controlledElement instanceof HTMLElement)) {
      continue;
    }

    const controlledTagName = controlledElement.tagName.toLowerCase();
    const controlledRole = controlledElement.getAttribute("role")?.toLowerCase() ?? "";
    const controlledAttributeText = getJoinedAttributeText(controlledElement, [
      "id",
      "class",
      "aria-label",
      "title",
      "data-testid",
      "role"
    ]);

    if (controlledTagName === "aside" || controlledRole === "complementary") {
      score += 180;
    }

    if (
      controlledTagName === "nav" ||
      controlledRole === "navigation" ||
      textMatchesAnyPattern(controlledAttributeText, SIDEBAR_CONTAINER_PATTERNS)
    ) {
      score += 140;
    }
  }

  return score;
};

const getSidebarCandidateScore = (element: HTMLElement, rectOverride?: DOMRect | null): number => {
  if (!isActivatableElement(element) || isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) return Number.NEGATIVE_INFINITY;

  let score = 40;
  let hasStrongSignal = false;
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();
  const textContent = getElementTextContent(element);
  const attributeText = getJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "role", "title", "class"],
    [textContent]
  );
  const controlsSignalScore = getSidebarControlsSignalScore(element);
  const hasSidebarAttributeSignal = textMatchesAnyPattern(
    attributeText,
    SIDEBAR_ATTRIBUTE_PATTERNS
  );
  const hasSidebarToggleSignal = textMatchesAnyPattern(attributeText, SIDEBAR_TOGGLE_PATTERNS);
  const hasNonNavigationMenuSignal = textMatchesAnyPattern(
    attributeText,
    SIDEBAR_NON_NAVIGATION_PATTERNS
  );

  if (hasNonNavigationMenuSignal && controlsSignalScore === 0 && !hasSidebarAttributeSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += controlsSignalScore;
  if (controlsSignalScore > 0) {
    hasStrongSignal = true;
  }

  if (element instanceof HTMLButtonElement || role === "button") {
    score += 60;
  }

  if (element instanceof HTMLAnchorElement && element.hasAttribute("href")) {
    score += 30;
  }

  if (tagName === "summary") {
    score += 20;
  }

  if (hasSidebarAttributeSignal) {
    score += 220;
    hasStrongSignal = true;
  }

  if (textMatchesAnyPattern(attributeText, SIDEBAR_OPEN_CLOSE_PATTERNS)) {
    score += 320;
    hasStrongSignal = true;
  }

  if (element.id === "guide-button" || !!element.closest("#guide-button")) {
    score += 700;
    hasStrongSignal = true;
  }

  if (hasSidebarToggleSignal) {
    score += 260;
    hasStrongSignal = true;
  }

  if (
    element.closest(
      "header, [role='banner'], [role='navigation'], [id*='masthead' i], [class*='masthead' i], [id*='topbar' i], [class*='topbar' i]"
    )
  ) {
    score += 120;
  }

  if (element.hasAttribute("aria-expanded")) {
    score += 70;

    if (element.getAttribute("aria-expanded") === "true" && controlsSignalScore > 0) {
      score += 180;
    }
  }

  if (element.hasAttribute("aria-haspopup")) {
    score += 30;
  }

  if (element.closest("header, [role='banner'], [role='navigation']")) {
    score += 40;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += Math.min(120, rect.height) / 8;
  score += Math.min(120, rect.width) / 8;

  if (rect.width <= 96 && rect.height <= 96) {
    score += 30;
  }

  if (rect.left < window.innerWidth * 0.35 && rect.top < window.innerHeight * 0.3) {
    score += 60;
  }

  if (rect.width > window.innerWidth * 0.6) {
    score -= 80;
  }

  return score;
};

export const getPreferredSidebarElementIndex = (elements: HTMLElement[]): number | null => {
  let bestIndex: number | null = null;
  let bestScore = 220;

  elements.forEach((element, index) => {
    const score = getSidebarCandidateScore(element);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const getCancelCandidateScore = (element: HTMLElement, rectOverride?: DOMRect | null): number => {
  const score = getActionDirectiveCandidateScore(
    element,
    CANCEL_ATTRIBUTE_PATTERNS,
    {
      boostDialogContext: true,
      shortTextPatterns: CANCEL_SHORT_TEXT_PATTERNS
    },
    rectOverride
  );

  if (score === Number.NEGATIVE_INFINITY) {
    return score;
  }

  const attributeText = getJoinedAttributeText(element, [
    "name",
    "id",
    "aria-label",
    "data-testid",
    "data-test-id",
    "role",
    "title",
    "class",
    "type"
  ]);

  if (
    textMatchesAnyPattern(attributeText, SIDEBAR_CONTAINER_PATTERNS) ||
    getSidebarControlsSignalScore(element) > 0
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  return score;
};

const getActionDirectiveCandidateScore = (
  element: HTMLElement,
  patterns: readonly RegExp[],
  options: {
    allowFormSignals?: boolean;
    relValues?: string[];
    boostDialogContext?: boolean;
    shortTextPatterns?: readonly RegExp[];
  } = {},
  rectOverride?: DOMRect | null
): number => {
  if (!isActivatableElement(element) || isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = rectOverride === undefined ? getMarkerRect(element) : rectOverride;
  if (!rect) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 20;
  let hasStrongSignal = false;
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();
  const textContent = getElementTextContent(element);
  const attributeText = getJoinedAttributeText(element, [
    "name",
    "id",
    "aria-label",
    "data-testid",
    "data-test-id",
    "role",
    "title",
    "class",
    "type"
  ]);

  if (textMatchesAnyPattern(attributeText, patterns)) {
    score += 240;
    hasStrongSignal = true;
  }

  if (
    options.shortTextPatterns &&
    isLikelyShortControlText(textContent) &&
    textMatchesAnyPattern(textContent, options.shortTextPatterns)
  ) {
    score += 220;
    hasStrongSignal = true;
  }

  if (
    options.relValues &&
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement)
  ) {
    const relValue = element.getAttribute("rel")?.toLowerCase() ?? "";
    const relParts = relValue.split(/\s+/);

    if (options.relValues.some((value) => relParts.includes(value))) {
      score += 260;
      hasStrongSignal = true;
    }
  }

  if (element instanceof HTMLButtonElement || role === "button") {
    score += 50;
  }

  if (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) {
    score += 40;
  }

  if (tagName === "summary") {
    score += 20;
  }

  if (options.allowFormSignals) {
    if (element instanceof HTMLInputElement && element.type.toLowerCase() === "submit") {
      score += 320;
      hasStrongSignal = true;
    }

    if (element.closest("form")) {
      score += 70;
    }
  }

  if (options.boostDialogContext) {
    if (element.closest("dialog, [role='dialog'], [aria-modal='true']")) {
      score += 90;
    }

    if (
      element.closest("[id*='modal' i], [class*='modal' i], [id*='popup' i], [class*='popup' i]")
    ) {
      score += 70;
    }
  }

  if (
    element.closest(
      "[aria-label*='pagination' i], [class*='pagination' i], nav, [role='navigation']"
    )
  ) {
    score += 60;
  }

  if (!hasStrongSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  score += Math.min(120, rect.height) / 10;
  score += Math.min(220, rect.width) / 12;

  return score;
};

const getNextCandidateScore = (element: HTMLElement, rectOverride?: DOMRect | null): number => {
  const score = getActionDirectiveCandidateScore(
    element,
    NEXT_ATTRIBUTE_PATTERNS,
    {
      relValues: ["next"],
      shortTextPatterns: NEXT_SHORT_TEXT_PATTERNS
    },
    rectOverride
  );

  if (score === Number.NEGATIVE_INFINITY) {
    return score;
  }

  const textContent = getElementTextContent(element);
  const semanticAttributeText = getJoinedAttributeText(
    element,
    ["name", "id", "aria-label", "data-testid", "data-test-id", "role", "title", "type"],
    [textContent]
  );
  const fullAttributeText = getJoinedAttributeText(element, [
    "name",
    "id",
    "aria-label",
    "data-testid",
    "data-test-id",
    "role",
    "title",
    "class",
    "type",
    "href",
    "rel"
  ]);
  const hasStrongSemanticSignal = textMatchesAnyPattern(
    semanticAttributeText,
    NEXT_STRONG_ATTRIBUTE_PATTERNS
  );
  const hasNoisyClassSignal = textMatchesAnyPattern(fullAttributeText, NOISY_NEXT_CLASS_PATTERNS);

  if (textMatchesAnyPattern(fullAttributeText, NEXT_FALSE_POSITIVE_PATTERNS)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (hasNoisyClassSignal && !hasStrongSemanticSignal) {
    return Number.NEGATIVE_INFINITY;
  }

  return hasStrongSemanticSignal ? score + 180 : score;
};

const getPreferredActionDirectiveElementIndex = (
  elements: HTMLElement[],
  patterns: readonly RegExp[],
  threshold: number,
  options: {
    allowFormSignals?: boolean;
    relValues?: string[];
    boostDialogContext?: boolean;
    shortTextPatterns?: readonly RegExp[];
  } = {}
): number | null => {
  let bestIndex: number | null = null;
  let bestScore = threshold;

  elements.forEach((element, index) => {
    const score = getActionDirectiveCandidateScore(element, patterns, options);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

export const getPreferredNextElementIndex = (elements: HTMLElement[]): number | null =>
  (() => {
    let bestIndex: number | null = null;
    let bestScore = 200;

    elements.forEach((element, index) => {
      const score = getNextCandidateScore(element);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  })();

export const getPreferredPrevElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, PREV_ATTRIBUTE_PATTERNS, 200, {
    relValues: ["prev"],
    shortTextPatterns: PREV_SHORT_TEXT_PATTERNS
  });

export const getPreferredCancelElementIndex = (elements: HTMLElement[]): number | null =>
  (() => {
    let bestIndex: number | null = null;
    let bestScore = 220;

    elements.forEach((element, index) => {
      const score = getCancelCandidateScore(element);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  })();

export const getPreferredSubmitElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, SUBMIT_ATTRIBUTE_PATTERNS, 220, {
    allowFormSignals: true,
    shortTextPatterns: SUBMIT_SHORT_TEXT_PATTERNS
  });

export const getPreferredLikeElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, LIKE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: LIKE_SHORT_TEXT_PATTERNS
  });

export const getPreferredDislikeElementIndex = (elements: HTMLElement[]): number | null =>
  getPreferredActionDirectiveElementIndex(elements, DISLIKE_ATTRIBUTE_PATTERNS, 220, {
    shortTextPatterns: DISLIKE_SHORT_TEXT_PATTERNS
  });

type ElementFeatureVector = {
  rect: DOMRect | null;
  isSelectable: boolean;
};

const getDefaultDirectiveThresholds = (): Record<HintDirective, number> => ({
  input: 180,
  attach: 220,
  home: 180,
  sidebar: 220,
  next: 200,
  prev: 200,
  cancel: 220,
  submit: 220,
  like: 220,
  dislike: 220
});

export const getPreferredDirectiveIndexes = (
  elements: HTMLElement[]
): Partial<Record<HintDirective, number>> => {
  const featureCache = new WeakMap<HTMLElement, ElementFeatureVector>();
  const bestIndexes: Partial<Record<HintDirective, number>> = {};
  const bestScores = getDefaultDirectiveThresholds();
  let selectableCount = 0;
  let onlySelectableIndex: number | null = null;

  const getFeatures = (element: HTMLElement): ElementFeatureVector => {
    const cached = featureCache.get(element);
    if (cached) {
      return cached;
    }

    const features: ElementFeatureVector = {
      rect: getMarkerRect(element),
      isSelectable: isSelectableElement(element)
    };

    featureCache.set(element, features);
    return features;
  };

  const updateBest = (directive: HintDirective, score: number, index: number): void => {
    if (score > bestScores[directive]) {
      bestScores[directive] = score;
      bestIndexes[directive] = index;
    }
  };

  elements.forEach((element, index) => {
    const features = getFeatures(element);

    if (features.isSelectable) {
      selectableCount += 1;
      onlySelectableIndex = index;
    }

    updateBest("input", getInputCandidateScore(element, features.rect), index);
    const attachScore = getAttachCandidateScore(element, features.rect);
    updateBest("attach", attachScore, index);
    updateBest("home", getHomeCandidateScore(element, features.rect), index);
    updateBest("sidebar", getSidebarCandidateScore(element, features.rect), index);
    // When an element strongly looks like an attachment/upload control, prefer @attach
    // and avoid also classifying that same element as @next.
    if (attachScore === Number.NEGATIVE_INFINITY) {
      updateBest("next", getNextCandidateScore(element, features.rect), index);
    }
    updateBest(
      "prev",
      getActionDirectiveCandidateScore(
        element,
        PREV_ATTRIBUTE_PATTERNS,
        {
          relValues: ["prev"],
          shortTextPatterns: PREV_SHORT_TEXT_PATTERNS
        },
        features.rect
      ),
      index
    );
    updateBest("cancel", getCancelCandidateScore(element, features.rect), index);
    updateBest(
      "submit",
      getActionDirectiveCandidateScore(
        element,
        SUBMIT_ATTRIBUTE_PATTERNS,
        {
          allowFormSignals: true,
          shortTextPatterns: SUBMIT_SHORT_TEXT_PATTERNS
        },
        features.rect
      ),
      index
    );
    updateBest(
      "like",
      getActionDirectiveCandidateScore(
        element,
        LIKE_ATTRIBUTE_PATTERNS,
        {
          shortTextPatterns: LIKE_SHORT_TEXT_PATTERNS
        },
        features.rect
      ),
      index
    );
    updateBest(
      "dislike",
      getActionDirectiveCandidateScore(
        element,
        DISLIKE_ATTRIBUTE_PATTERNS,
        {
          shortTextPatterns: DISLIKE_SHORT_TEXT_PATTERNS
        },
        features.rect
      ),
      index
    );
  });

  if (selectableCount === 1 && onlySelectableIndex !== null) {
    bestIndexes.input = onlySelectableIndex;
  }

  if (bestIndexes.attach !== undefined) {
    bestIndexes.attach = remapAttachDirectiveIndex(
      elements,
      bestIndexes.attach,
      (element) => getFeatures(element).rect
    );
  }

  return bestIndexes;
};

export const getAttachEquivalentIndexes = (
  elements: HTMLElement[],
  attachIndex: number
): number[] => {
  const attachElement = elements[attachIndex];
  if (!attachElement) {
    return [];
  }

  const attachRect = getMarkerRect(attachElement);
  if (!attachRect) {
    return [attachIndex];
  }

  return elements.flatMap((element, index) => {
    const score = getAttachCandidateScore(element);
    if (score === Number.NEGATIVE_INFINITY) {
      return [];
    }

    const rect = getMarkerRect(element);
    if (!rect || getRectOverlapRatio(attachRect, rect) < 0.7) {
      return [];
    }

    return [index];
  });
};

export const getStronglyOverlappingHintIndexes = (
  elements: HTMLElement[],
  targetIndex: number,
  minimumOverlapRatio = 0.35
): number[] => {
  const targetElement = elements[targetIndex];
  if (!targetElement) {
    return [];
  }

  const targetRect = getMarkerRect(targetElement);
  if (!targetRect) {
    return [targetIndex];
  }

  return elements.flatMap((element, index) => {
    const rect = getMarkerRect(element);
    if (
      !rect ||
      (getRectOverlapRatio(targetRect, rect) < minimumOverlapRatio &&
        !isRectCenterNearTarget(targetRect, rect))
    ) {
      return [];
    }

    return [index];
  });
};