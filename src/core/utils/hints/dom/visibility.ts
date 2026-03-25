import {
  type HintVisibilityContext,
  type PointHitTestResult,
  type RectLike
} from "~/src/core/utils/hints/dom/shared";
import { getMarkerRect } from "~/src/core/utils/hints/dom/geometry";
import {
  isActivatableElement,
  isIntrinsicInteractiveElement
} from "~/src/core/utils/hints/dom/interactive";

const POPUP_OCCLUDER_SELECTOR = [
  "dialog",
  "[role='dialog']",
  "[aria-modal='true']",
  "[id*='modal' i]",
  "[class*='modal' i]",
  "[id*='popup' i]",
  "[class*='popup' i]"
].join(",");

const getTopElementAtPoint = (
  x: number,
  y: number,
  root: Document | ShadowRoot = document,
  visitedRoots: Set<Document | ShadowRoot> = new Set(),
  visitedElements: Set<Element> = new Set()
): Element | null => {
  if (visitedRoots.has(root)) {
    return null;
  }

  visitedRoots.add(root);
  const topElement = root.elementsFromPoint(x, y)[0] ?? null;

  if (!topElement || visitedElements.has(topElement)) {
    return topElement;
  }

  visitedElements.add(topElement);

  if (topElement instanceof HTMLElement && topElement.shadowRoot) {
    return (
      getTopElementAtPoint(x, y, topElement.shadowRoot, visitedRoots, visitedElements) ?? topElement
    );
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

const isRectFullyInside = (rect: RectLike, container: RectLike, tolerance = 1): boolean => {
  return (
    rect.top >= container.top - tolerance &&
    rect.left >= container.left - tolerance &&
    rect.bottom <= container.bottom + tolerance &&
    rect.right <= container.right + tolerance
  );
};

const clipsDescendants = (style: CSSStyleDeclaration): boolean => {
  return [style.overflow, style.overflowX, style.overflowY].some((value) => {
    return value === "hidden" || value === "clip" || value === "scroll" || value === "auto";
  });
};

const getComposedParentElement = (element: HTMLElement): HTMLElement | null => {
  const parent = element.parentElement;
  if (parent) {
    return parent;
  }

  const root = element.getRootNode();
  return root instanceof ShadowRoot && root.host instanceof HTMLElement ? root.host : null;
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

const isPopupOccludingElement = (element: Element): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return element.matches(POPUP_OCCLUDER_SELECTOR);
};

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

  if (centerResult === "popup-occluded") {
    return false;
  }

  if (!isIntrinsic) {
    const [cornerX, cornerY] = getCornerPoints(rect)[0]!;
    const cornerResult = getCachedPointHitTestResult(element, cornerX, cornerY);
    return cornerResult === "reachable";
  }

  let sawOccludedPoint = centerResult === "occluded";
  for (const [x, y] of getCornerPoints(rect)) {
    const result = getCachedPointHitTestResult(element, x, y);
    if (result === "popup-occluded") {
      return false;
    }

    if (result === "reachable") {
      return true;
    }

    sawOccludedPoint ||= result === "occluded";
  }

  return !sawOccludedPoint;
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

    if (isComposedDescendant(element, topElement) || isComposedDescendant(topElement, element)) {
      return "reachable";
    }

    return isPopupOccludingElement(topElement) ? "popup-occluded" : "occluded";
  };

  const isClippedByAncestor = (element: HTMLElement, rect: DOMRect): boolean => {
    let current = getComposedParentElement(element);

    while (current) {
      if (!isStyleVisibleAndClickable(getStyle(current))) {
        return true;
      }

      if (clipsDescendants(getStyle(current))) {
        const ancestorRect = getRect(current);
        if (ancestorRect && !isRectFullyInside(rect, ancestorRect)) {
          return true;
        }
      }

      current = getComposedParentElement(current);
    }

    return false;
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
      !isClippedByAncestor(element, rect) &&
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