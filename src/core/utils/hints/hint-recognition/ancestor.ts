import {
  areRectsEquivalent,
  getElementTabIndex,
  isIntrinsicInteractiveElement
} from "~/src/core/utils/hints/dom";
import type { GetPreference, GetRect } from "~/src/core/utils/hints/hint-recognition/shared";

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

const getRectArea = (rect: DOMRect): number => Math.max(1, rect.width * rect.height);

export const hasEquivalentAncestorTarget = (
  element: HTMLElement,
  candidates: ReadonlySet<HTMLElement>,
  getRect: GetRect
): boolean => {
  const elementRect = getRect(element);
  if (!elementRect) {
    return false;
  }

  if (!(element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement)) {
    if (isIntrinsicInteractiveElement(element)) {
      return false;
    }

    const elementArea = getRectArea(elementRect);
    let current = element.parentElement;
    while (current) {
      if (
        candidates.has(current) &&
        current.contains(element) &&
        isIntrinsicInteractiveElement(current)
      ) {
        const currentRect = getRect(current);
        if (!currentRect) {
          current = current.parentElement;
          continue;
        }

        const overlapRatio = getRectOverlapRatio(currentRect, elementRect);
        const currentArea = getRectArea(currentRect);
        const areaRatio = Math.max(elementArea, currentArea) / Math.min(elementArea, currentArea);
        if (
          (areRectsEquivalent(currentRect, elementRect) || overlapRatio >= 0.9) &&
          areaRatio <= 1.75
        ) {
          return true;
        }
      }

      current = current.parentElement;
    }

    return false;
  }

  const resolvedHref = element.href;
  if (!resolvedHref) {
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

export const hasEquivalentDescendantTarget = (
  element: HTMLElement,
  candidates: ReadonlySet<HTMLElement>,
  getRect: GetRect,
  getPreference: GetPreference
): boolean => {
  const elementPreference = getPreference(element);
  if (isIntrinsicInteractiveElement(element)) {
    return false;
  }

  const elementRect = getRect(element);
  if (!elementRect) {
    return false;
  }

  const elementArea = getRectArea(elementRect);

  for (const candidate of candidates) {
    if (candidate === element || !element.contains(candidate)) {
      continue;
    }

    if (getPreference(candidate) <= elementPreference) {
      continue;
    }

    const candidateRect = getRect(candidate);
    if (!candidateRect) {
      continue;
    }

    const overlapRatio = getRectOverlapRatio(elementRect, candidateRect);
    if (!areRectsEquivalent(elementRect, candidateRect) && overlapRatio < 0.9) {
      continue;
    }

    const candidateArea = getRectArea(candidateRect);
    const areaRatio = Math.max(elementArea, candidateArea) / Math.min(elementArea, candidateArea);
    if (areaRatio > 1.75) {
      continue;
    }

    return true;
  }

  return false;
};