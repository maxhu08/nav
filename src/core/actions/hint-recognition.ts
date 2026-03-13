import { getDeepActiveElement, isSelectableElement } from "~/src/core/utils/isEditableTarget";

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

  return hasClickablePoint(element, rect);
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
const YOUTUBE_SIDEBAR_TOGGLE_PATTERNS = [/\bguide\b/i, /\bguide-button\b/i, /\bmenu\b/i];

const isYouTubeHostname = (): boolean => /(^|\.)youtube\.com$/i.test(window.location.hostname);

const HOME_LOGO_PATTERNS = [/\blogo\b/i, /\bbrand\b/i];
const HOME_PATHS = new Set(["/", "/home", "/homepage", "/dashboard"]);

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

export const getPreferredSearchElementIndex = (elements: HTMLElement[]): number | null => {
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

const getSidebarCandidateScore = (element: HTMLElement): number => {
  if (!isActivatableElement(element) || isSelectableElement(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = getMarkerRect(element);
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
  const isYouTube = isYouTubeHostname();

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

  if (textMatchesAnyPattern(attributeText, SIDEBAR_ATTRIBUTE_PATTERNS)) {
    score += 220;
    hasStrongSignal = true;
  }

  if (isYouTube) {
    if (element.id === "guide-button" || !!element.closest("#guide-button")) {
      score += 700;
      hasStrongSignal = true;
    }

    if (textMatchesAnyPattern(attributeText, YOUTUBE_SIDEBAR_TOGGLE_PATTERNS)) {
      score += 260;
      hasStrongSignal = true;
    }

    if (element.closest("ytd-masthead, #masthead")) {
      score += 120;
    }
  }

  if (element.hasAttribute("aria-expanded")) {
    score += 70;
  }

  if (element.hasAttribute("aria-haspopup")) {
    score += 30;
  }

  if (element.closest("header, [role='banner'], [role='navigation']")) {
    score += 40;
  }

  if (!hasStrongSignal && score < 220) {
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