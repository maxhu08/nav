import { areRectsEquivalent } from "~/src/core/utils/hints/dom";
import type {
  GetIdentity,
  GetPreference,
  GetRect
} from "~/src/core/utils/hints/hint-recognition/shared";

const getApproximateRectKey = (rect: DOMRect): string => {
  const round = (value: number): number => Math.round(value * 2) / 2;
  return `${round(rect.top)}:${round(rect.left)}:${round(rect.width)}:${round(rect.height)}`;
};

const getEquivalentTargetBucketKey = (
  element: HTMLElement,
  rect: DOMRect | null,
  identity: string | null
): string => {
  const role = element.getAttribute("role")?.toLowerCase() ?? "";
  const rectKey = rect ? getApproximateRectKey(rect) : "no-rect";
  return `${rectKey}|${identity ?? ""}|${role}|${element.tagName}`;
};

const areEquivalentHintTargets = (
  leftElement: HTMLElement,
  rightElement: HTMLElement,
  getRect: GetRect,
  getIdentity: GetIdentity
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

  const leftRole = leftElement.getAttribute("role")?.toLowerCase() ?? "";
  const rightRole = rightElement.getAttribute("role")?.toLowerCase() ?? "";
  if (leftRole || rightRole) {
    return leftRole === rightRole;
  }

  return leftElement.tagName === rightElement.tagName;
};

export const dedupeEquivalentHintTargets = (
  elements: HTMLElement[],
  getRect: GetRect,
  getIdentity: GetIdentity,
  getPreference: GetPreference
): HTMLElement[] => {
  const bucketMap = new Map<string, HTMLElement[]>();

  for (const element of elements) {
    const bucketKey = getEquivalentTargetBucketKey(element, getRect(element), getIdentity(element));
    const bucket = bucketMap.get(bucketKey);
    if (bucket) {
      bucket.push(element);
    } else {
      bucketMap.set(bucketKey, [element]);
    }
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

      const existing = representatives[duplicateIndex]!;
      if (getPreference(element) > getPreference(existing)) {
        representatives[duplicateIndex] = element;
      }
    }

    deduped.push(...representatives);
  }

  return deduped;
};