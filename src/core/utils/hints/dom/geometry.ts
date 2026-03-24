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

export const areRectsEquivalent = (leftRect: DOMRect, rightRect: DOMRect): boolean =>
  Math.abs(leftRect.top - rightRect.top) < 1 &&
  Math.abs(leftRect.left - rightRect.left) < 1 &&
  Math.abs(leftRect.width - rightRect.width) < 1 &&
  Math.abs(leftRect.height - rightRect.height) < 1;