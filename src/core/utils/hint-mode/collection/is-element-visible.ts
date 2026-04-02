const clampPoint = (value: number, max: number): number => {
  return Math.min(Math.max(value, 0), max);
};

const isPointAccessible = (element: HTMLElement, x: number, y: number): boolean => {
  const [hit] =
    typeof document.elementsFromPoint === "function"
      ? document.elementsFromPoint(x, y)
      : [document.elementFromPoint(x, y)];

  if (!(hit instanceof Element)) {
    return false;
  }

  return element === hit || element.contains(hit) || hit.contains(element);
};

const isElementOccluded = (element: HTMLElement, rect: DOMRect): boolean => {
  const maxX = Math.max(window.innerWidth - 1, 0);
  const maxY = Math.max(window.innerHeight - 1, 0);
  const insetX = Math.min(Math.max(rect.width * 0.25, 1), rect.width / 2);
  const insetY = Math.min(Math.max(rect.height * 0.25, 1), rect.height / 2);
  const samplePoints: Array<[number, number]> = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + insetX, rect.top + insetY],
    [rect.right - insetX, rect.top + insetY],
    [rect.left + insetX, rect.bottom - insetY],
    [rect.right - insetX, rect.bottom - insetY]
  ];

  return !samplePoints.some(([x, y]) => {
    return isPointAccessible(element, clampPoint(x, maxX), clampPoint(y, maxY));
  });
};

export const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.visibility === "hidden" || style.display === "none") {
    return false;
  }

  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth &&
    rect.top <= window.innerHeight &&
    !isElementOccluded(element, rect)
  );
};