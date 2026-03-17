import { isSelectableElement } from "~/src/core/utils/is-editable-target";

export type RectLike = Pick<DOMRect, "left" | "top" | "right" | "bottom" | "width" | "height">;
type PointHitTestResult = "reachable" | "occluded" | "missing";

export type HintVisibilityContext = {
  getRect: (element: HTMLElement) => DOMRect | null;
  isHintable: (element: HTMLElement) => boolean;
  isVisibleHintTarget: (element: HTMLElement) => boolean;
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

export const getMarkerRect = (element: HTMLElement): DOMRect | null => {
  let bestRect: DOMRect | null = null;

  for (const rect of element.getClientRects()) {
    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }

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

export const getDomDepth = (element: HTMLElement): number => {
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

const isRectInViewport = (rect: DOMRect): boolean => {
  return !(
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > window.innerHeight ||
    rect.left > window.innerWidth
  );
};

const isStyleVisibleAndClickable = (style: CSSStyleDeclaration): boolean => {
  return !(
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse" ||
    Number.parseFloat(style.opacity) === 0 ||
    style.pointerEvents === "none"
  );
};

const getCenterPoint = (rect: DOMRect): [number, number] => [
  rect.left + rect.width * 0.5,
  rect.top + rect.height * 0.5
];

const getCornerPoints = (rect: DOMRect): Array<[number, number]> => [
  [rect.left + 0.1, rect.top + 0.1],
  [rect.right - 0.1, rect.top + 0.1],
  [rect.left + 0.1, rect.bottom - 0.1],
  [rect.right - 0.1, rect.bottom - 0.1]
];

const getAdaptiveHitTestResult = (
  element: HTMLElement,
  rect: DOMRect,
  isIntrinsic: boolean,
  getCachedPointHitTestResult: (element: HTMLElement, x: number, y: number) => PointHitTestResult
): boolean => {
  const [centerX, centerY] = getCenterPoint(rect);
  const centerResult = getCachedPointHitTestResult(element, centerX, centerY);
  if (centerResult === "reachable") {
    return true;
  }

  if (!isIntrinsic) {
    const [cornerX, cornerY] = getCornerPoints(rect)[0]!;
    return getCachedPointHitTestResult(element, cornerX, cornerY) === "reachable";
  }

  let sawOccludedPoint = centerResult === "occluded";

  for (const [x, y] of getCornerPoints(rect)) {
    const result = getCachedPointHitTestResult(element, x, y);
    if (result === "reachable") {
      return true;
    }

    sawOccludedPoint ||= result === "occluded";
  }

  return !sawOccludedPoint;
};

export const getElementTabIndex = (element: HTMLElement): number | null => {
  const tabIndexValue = element.getAttribute("tabindex");
  if (tabIndexValue === null) {
    return null;
  }

  const tabIndex = Number.parseInt(tabIndexValue, 10);
  return Number.isNaN(tabIndex) ? null : tabIndex;
};

export const hasInteractiveRole = (element: HTMLElement): boolean => {
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

export const isIntrinsicInteractiveElement = (element: HTMLElement): boolean => {
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

export const areRectsEquivalent = (leftRect: DOMRect, rightRect: DOMRect): boolean =>
  Math.abs(leftRect.top - rightRect.top) < 1 &&
  Math.abs(leftRect.left - rightRect.left) < 1 &&
  Math.abs(leftRect.width - rightRect.width) < 1 &&
  Math.abs(leftRect.height - rightRect.height) < 1;

export const getHintTargetPreference = (element: HTMLElement): number => {
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

export const isActivatableElement = (element: HTMLElement): boolean => {
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

export const createHintVisibilityContext = (): HintVisibilityContext => {
  const activatableCache = new WeakMap<HTMLElement, boolean>();
  const pointResultCache = new Map<string, Element | null>();
  const rectCache = new WeakMap<HTMLElement, DOMRect | null>();
  const styleCache = new WeakMap<HTMLElement, CSSStyleDeclaration>();
  const visibleTargetCache = new WeakMap<HTMLElement, boolean>();

  const getRect = (element: HTMLElement): DOMRect | null => {
    if (rectCache.has(element)) {
      return rectCache.get(element)!;
    }

    const rect = getMarkerRect(element);
    rectCache.set(element, rect);
    return rect;
  };

  const getStyle = (element: HTMLElement): CSSStyleDeclaration => {
    const cachedStyle = styleCache.get(element);
    if (cachedStyle) {
      return cachedStyle;
    }

    const style = window.getComputedStyle(element);
    styleCache.set(element, style);
    return style;
  };

  const getCachedPointHitTestResult = (
    element: HTMLElement,
    x: number,
    y: number
  ): PointHitTestResult => {
    const pointKey = `${Math.round(x * 2) / 2}:${Math.round(y * 2) / 2}`;
    let topElement = pointResultCache.get(pointKey);

    if (topElement === undefined) {
      topElement = getTopElementAtPoint(x, y);
      pointResultCache.set(pointKey, topElement);
    }

    if (!topElement) {
      return "missing";
    }

    return isComposedDescendant(element, topElement) || isComposedDescendant(topElement, element)
      ? "reachable"
      : "occluded";
  };

  const isVisibleTarget = (element: HTMLElement): boolean => {
    const cachedVisibility = visibleTargetCache.get(element);
    if (cachedVisibility !== undefined) {
      return cachedVisibility;
    }

    const rect = getRect(element);
    const isVisible =
      !!rect &&
      isRectInViewport(rect) &&
      isStyleVisibleAndClickable(getStyle(element)) &&
      getAdaptiveHitTestResult(
        element,
        rect,
        isIntrinsicInteractiveElement(element),
        getCachedPointHitTestResult
      );

    visibleTargetCache.set(element, isVisible);
    return isVisible;
  };

  const isHintable = (element: HTMLElement): boolean => {
    if (isExcludedHintTarget(element)) {
      return false;
    }

    const cachedActivatable = activatableCache.get(element);
    const isActivatable = cachedActivatable ?? isActivatableElement(element);
    if (cachedActivatable === undefined) {
      activatableCache.set(element, isActivatable);
    }

    return isActivatable && isVisibleTarget(element);
  };

  const isVisibleHintTarget = (element: HTMLElement): boolean => {
    if (isExcludedHintTarget(element)) {
      return false;
    }

    return isVisibleTarget(element);
  };

  return {
    getRect,
    isHintable,
    isVisibleHintTarget
  };
};

export const isHintable = (element: HTMLElement): boolean => {
  return createHintVisibilityContext().isHintable(element);
};

export const isVisibleHintTarget = (element: HTMLElement): boolean => {
  return createHintVisibilityContext().isVisibleHintTarget(element);
};