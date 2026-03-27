export const getElementImageUrl = (element: Element): string | null => {
  if (element instanceof HTMLImageElement) {
    return element.currentSrc || element.src || null;
  }

  if (element instanceof SVGElement && element.tagName.toLowerCase() === "image") {
    return element.getAttribute("href") ?? element.getAttribute("xlink:href") ?? null;
  }

  return null;
};