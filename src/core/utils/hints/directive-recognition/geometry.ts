export const getRectOverlapRatio = (leftRect: DOMRect, rightRect: DOMRect): number => {
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

export const getRectGapDistance = (leftRect: DOMRect, rightRect: DOMRect): number => {
  const horizontalGap = Math.max(
    0,
    leftRect.left - rightRect.right,
    rightRect.left - leftRect.right
  );
  const verticalGap = Math.max(0, leftRect.top - rightRect.bottom, rightRect.top - leftRect.bottom);

  return Math.hypot(horizontalGap, verticalGap);
};

export const isRectCenterNearTarget = (
  targetRect: DOMRect,
  candidateRect: DOMRect,
  padding = 12
): boolean => {
  const centerX = candidateRect.left + candidateRect.width / 2;
  const centerY = candidateRect.top + candidateRect.height / 2;

  return (
    centerX >= targetRect.left - padding &&
    centerX <= targetRect.right + padding &&
    centerY >= targetRect.top - padding &&
    centerY <= targetRect.bottom + padding
  );
};