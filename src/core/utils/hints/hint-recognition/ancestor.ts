import { areRectsEquivalent, getElementTabIndex } from "~/src/core/utils/hints/dom";
import type { GetRect } from "~/src/core/utils/hints/hint-recognition/shared";

export const hasEquivalentAncestorTarget = (
  element: HTMLElement,
  candidates: ReadonlySet<HTMLElement>,
  getRect: GetRect
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