import {
  getAttachEquivalentIndexes,
  getHintableElements,
  getPreferredDirectiveIndexes,
  getMarkerRect,
  getStronglyOverlappingHintIndexes
} from "~/src/core/utils/hints/hint-recognition";
import {
  NAV_DEBUG_HINT_TARGET_REQUEST_EVENT,
  NAV_DEBUG_HINT_TARGET_RESPONSE_EVENT
} from "~/src/core/debug/events";
import { RESERVED_HINT_DIRECTIVES } from "~/src/utils/hint-reserved-label-directives";

type NavDebugRequestDetail = {
  requestId: string;
  selector: string;
};

const buildHintTargetDebugResult = (selector: string) => {
  const element = document.querySelector<HTMLElement>(selector);

  if (!(element instanceof HTMLElement)) {
    return {
      targetFound: false,
      selector
    };
  }

  const hintableElements = getHintableElements("current-tab");
  const hintableIndex = hintableElements.indexOf(element);
  const preferredDirectiveIndexes = getPreferredDirectiveIndexes(hintableElements);
  const attachIndex = preferredDirectiveIndexes.attach;
  const preferredDirectiveForTarget = (
    Object.entries(preferredDirectiveIndexes) as Array<[string, number | undefined]>
  )
    .filter(([, index]) => index === hintableIndex)
    .map(([directive]) => directive);
  const rect = getMarkerRect(element);
  const style = window.getComputedStyle(element);
  const attachEquivalentIndexes =
    attachIndex === undefined ? [] : getAttachEquivalentIndexes(hintableElements, attachIndex);
  const overlappingAttachIndexes =
    attachIndex === undefined
      ? []
      : getStronglyOverlappingHintIndexes(hintableElements, attachIndex);

  return {
    targetFound: true,
    selector,
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    className: element.className || null,
    isInHintableCollection: hintableIndex !== -1,
    hintableIndex: hintableIndex === -1 ? null : hintableIndex,
    totalHintableElements: hintableElements.length,
    preferredDirectiveForTarget,
    preferredDirectiveIndexes,
    attachEquivalentIndexes,
    overlappingAttachIndexes,
    isReservedDirectiveMatch: RESERVED_HINT_DIRECTIVES.some(
      (directive) => preferredDirectiveIndexes[directive] === hintableIndex
    ),
    rect: rect
      ? {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        }
      : null,
    style: {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      cursor: style.cursor
    },
    nearbyHintables: overlappingAttachIndexes
      .map((index) => {
        const candidate = hintableElements[index];

        const candidateRect = getMarkerRect(candidate);

        return {
          index,
          tagName: candidate.tagName.toLowerCase(),
          id: candidate.id || null,
          className: candidate.className || null,
          dataTestId: candidate.getAttribute("data-testid"),
          ariaLabel: candidate.getAttribute("aria-label"),
          preferredDirectives: (
            Object.entries(preferredDirectiveIndexes) as Array<[string, number | undefined]>
          )
            .filter(([, preferredIndex]) => preferredIndex === index)
            .map(([directive]) => directive),
          rect: candidateRect
            ? {
                left: candidateRect.left,
                top: candidateRect.top,
                right: candidateRect.right,
                bottom: candidateRect.bottom,
                width: candidateRect.width,
                height: candidateRect.height
              }
            : null
        };
      })
      .filter(Boolean)
  };
};

const installContentListeners = (): void => {
  window.addEventListener(NAV_DEBUG_HINT_TARGET_REQUEST_EVENT, (event) => {
    if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== "object") {
      return;
    }

    const detail = event.detail as Partial<NavDebugRequestDetail>;
    if (typeof detail.requestId !== "string" || typeof detail.selector !== "string") {
      return;
    }

    const result = buildHintTargetDebugResult(detail.selector);
    window.dispatchEvent(
      new CustomEvent(NAV_DEBUG_HINT_TARGET_RESPONSE_EVENT, {
        detail: {
          requestId: detail.requestId,
          result
        }
      })
    );
  });
};

export const installNavDebugApi = (): void => {
  installContentListeners();
};