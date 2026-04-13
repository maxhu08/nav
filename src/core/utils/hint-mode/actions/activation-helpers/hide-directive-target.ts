import {
  dispatchSyntheticClickEventAt,
  dispatchSyntheticPressEventsAt
} from "~/src/core/utils/hint-mode/actions/activation-helpers/dispatch-synthetic-events";
import { dispatchFocusIndicator } from "~/src/core/utils/hint-mode/actions/activation-helpers/dispatch-focus-indicator";

const clampToViewport = (value: number, viewportSize: number): number => {
  return Math.min(Math.max(Math.round(value), 1), Math.max(viewportSize - 1, 1));
};

const resolveHideDismissTarget = (
  modalElement: HTMLElement
): { clientX: number; clientY: number; element: HTMLElement } | null => {
  const modalRect = modalElement.getBoundingClientRect();
  const candidatePoints = [
    { clientX: modalRect.right + 16, clientY: modalRect.top + 16 },
    { clientX: modalRect.left - 16, clientY: modalRect.top + 16 },
    { clientX: modalRect.left + 16, clientY: modalRect.top - 16 },
    { clientX: modalRect.left + 16, clientY: modalRect.bottom + 16 }
  ].map((point) => ({
    clientX: clampToViewport(point.clientX, window.innerWidth),
    clientY: clampToViewport(point.clientY, window.innerHeight)
  }));

  for (const point of candidatePoints) {
    const elements =
      typeof document.elementsFromPoint === "function"
        ? document.elementsFromPoint(point.clientX, point.clientY)
        : [];

    for (const element of elements) {
      if (
        element instanceof HTMLElement &&
        element !== modalElement &&
        !modalElement.contains(element)
      ) {
        return {
          element,
          clientX: point.clientX,
          clientY: point.clientY
        };
      }
    }
  }

  return document.body instanceof HTMLElement && document.body !== modalElement
    ? {
        element: document.body,
        clientX: candidatePoints[0]?.clientX ?? 1,
        clientY: candidatePoints[0]?.clientY ?? 1
      }
    : null;
};

export const hideDirectiveTarget = (modalElement: HTMLElement): boolean => {
  const dismissTarget = resolveHideDismissTarget(modalElement);
  if (!dismissTarget) {
    return false;
  }

  dispatchFocusIndicator(modalElement);
  dispatchSyntheticPressEventsAt(
    dismissTarget.element,
    dismissTarget.clientX,
    dismissTarget.clientY
  );
  dispatchSyntheticClickEventAt(
    dismissTarget.element,
    dismissTarget.clientX,
    dismissTarget.clientY
  );
  return true;
};