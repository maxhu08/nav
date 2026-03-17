import { revealElementForHintCollection } from "~/src/core/utils/hints/hint-recognition";
import type { RevealedHintElement } from "~/src/core/utils/hints/model";
import type { HintMarker } from "~/src/core/utils/hints/types";

const getVideoHintContainer = (element: HTMLElement): HTMLElement | null => {
  if (element instanceof HTMLVideoElement) {
    return element;
  }

  let current: HTMLElement | null = element;

  while (current) {
    if (current.querySelector("video")) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

export const revealVideoHintControls = (
  markers: HintMarker[],
  revealedElements: RevealedHintElement[]
): void => {
  const seen = new Set<HTMLElement>();

  for (const { element } of markers) {
    const videoContainer = getVideoHintContainer(element);
    if (!videoContainer) continue;

    let current: HTMLElement | null = element;

    while (current) {
      if (!seen.has(current)) {
        revealElementForHintCollection(current, seen, revealedElements);
      }

      if (current === videoContainer) {
        break;
      }

      current = current.parentElement;
    }
  }
};