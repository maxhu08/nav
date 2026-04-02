export const getClosestLinkUrl = (element: Element): string | null => {
  const link = element.closest("a[href], area[href]");
  if (link instanceof HTMLAnchorElement || link instanceof HTMLAreaElement) {
    return link.href || null;
  }

  return null;
};