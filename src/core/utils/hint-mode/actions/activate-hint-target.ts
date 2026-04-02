import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";
import { showHintToastError } from "~/src/core/utils/hint-mode/actions/show-hint-toast-error";
import { showHintToastSuccess } from "~/src/core/utils/hint-mode/actions/show-hint-toast-success";
import type { HintActionMode, HintTarget } from "~/src/core/utils/hint-mode/shared/types";
import { writeClipboardImage } from "~/src/core/utils/hint-mode/actions/write-clipboard-image";
import { writeClipboardText } from "~/src/core/utils/hint-mode/actions/write-clipboard-text";

const shouldFocusBeforeActivation = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable
  );
};

const dispatchSyntheticPressEvents = (element: HTMLElement): void => {
  const rect = element.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;
  dispatchSyntheticPressEventsAt(element, clientX, clientY);
};

const dispatchSyntheticPressEventsAt = (
  element: HTMLElement,
  clientX: number,
  clientY: number
): void => {
  const sharedMouseInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    composed: true
  };

  if (typeof window.PointerEvent === "function") {
    const sharedPointerInit: PointerEventInit = {
      ...sharedMouseInit,
      button: 0,
      buttons: 1,
      isPrimary: true,
      pointerId: 1,
      pointerType: "mouse"
    };

    element.dispatchEvent(new window.PointerEvent("pointerdown", sharedPointerInit));
  }

  element.dispatchEvent(
    new window.MouseEvent("mousedown", {
      ...sharedMouseInit,
      button: 0,
      buttons: 1
    })
  );

  if (typeof window.PointerEvent === "function") {
    element.dispatchEvent(
      new window.PointerEvent("pointerup", {
        ...sharedMouseInit,
        button: 0,
        buttons: 0,
        isPrimary: true,
        pointerId: 1,
        pointerType: "mouse"
      })
    );
  }

  element.dispatchEvent(
    new window.MouseEvent("mouseup", {
      ...sharedMouseInit,
      button: 0,
      buttons: 0
    })
  );
};

const dispatchSyntheticClickEventAt = (
  element: HTMLElement,
  clientX: number,
  clientY: number
): void => {
  element.dispatchEvent(
    new window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      button: 0,
      buttons: 0,
      composed: true
    })
  );
};

const dispatchSyntheticContextMenuEventAt = (
  element: HTMLElement,
  clientX: number,
  clientY: number
): void => {
  element.dispatchEvent(
    new window.MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      button: 2,
      buttons: 0,
      composed: true
    })
  );
};

const dispatchSyntheticRightClickEvents = (element: HTMLElement): void => {
  const rect = element.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;
  const sharedMouseInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    composed: true
  };

  if (typeof window.PointerEvent === "function") {
    const sharedPointerInit: PointerEventInit = {
      ...sharedMouseInit,
      button: 2,
      buttons: 2,
      isPrimary: true,
      pointerId: 1,
      pointerType: "mouse"
    };

    element.dispatchEvent(new window.PointerEvent("pointerdown", sharedPointerInit));
  }

  element.dispatchEvent(
    new window.MouseEvent("mousedown", {
      ...sharedMouseInit,
      button: 2,
      buttons: 2
    })
  );

  if (typeof window.PointerEvent === "function") {
    element.dispatchEvent(
      new window.PointerEvent("pointerup", {
        ...sharedMouseInit,
        button: 2,
        buttons: 0,
        isPrimary: true,
        pointerId: 1,
        pointerType: "mouse"
      })
    );
  }

  element.dispatchEvent(
    new window.MouseEvent("mouseup", {
      ...sharedMouseInit,
      button: 2,
      buttons: 0
    })
  );

  dispatchSyntheticContextMenuEventAt(element, clientX, clientY);
};

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

const hideDirectiveTarget = (modalElement: HTMLElement): boolean => {
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

const focusTargetElement = (element: HTMLElement): void => {
  if (typeof element.focus !== "function") {
    return;
  }

  element.focus({ preventScroll: true });
  dispatchFocusIndicator(element);
};

const dispatchFocusIndicator = (element: HTMLElement): void => {
  window.dispatchEvent(
    new CustomEvent(FOCUS_INDICATOR_EVENT, {
      detail: { element }
    })
  );
};

const dispatchTextInputEvents = (element: HTMLElement): void => {
  element.dispatchEvent(new window.Event("input", { bubbles: true, cancelable: false }));
  element.dispatchEvent(new window.Event("change", { bubbles: true, cancelable: false }));
};

const clearDirectiveTarget = (element: HTMLElement): boolean => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.readOnly || element.disabled) {
      return false;
    }

    element.value = "";
    dispatchTextInputEvents(element);
    focusTargetElement(element);
    if (typeof element.setSelectionRange === "function") {
      element.setSelectionRange(0, 0);
    }
    return true;
  }

  if (element.isContentEditable) {
    element.textContent = "";
    dispatchTextInputEvents(element);
    focusTargetElement(element);
    return true;
  }

  return false;
};

export const activateHintTarget = (mode: HintActionMode, target: HintTarget): boolean => {
  if (target.directiveMatch?.directive === "erase") {
    return clearDirectiveTarget(target.element);
  }

  if (target.directiveMatch?.directive === "hide") {
    return hideDirectiveTarget(target.element);
  }

  if (mode === "yank-link-url") {
    const url = target.linkUrl;
    if (!url) {
      return false;
    }

    void writeClipboardText(url).then((didCopy) => {
      if (didCopy) {
        showHintToastSuccess("Link URL yanked", url);
      } else {
        showHintToastError("Could not yank link URL", "Clipboard access was denied.");
      }
    });
    return true;
  }

  if (mode === "yank-image-url") {
    const imageUrl = target.imageUrl;
    if (!imageUrl) {
      return false;
    }

    void writeClipboardText(imageUrl).then((didCopy) => {
      if (didCopy) {
        showHintToastSuccess("Image URL yanked", imageUrl);
      } else {
        showHintToastError("Could not yank image URL", "Clipboard access was denied.");
      }
    });
    return true;
  }

  if (mode === "yank-image") {
    const imageUrl = target.imageUrl;
    if (!imageUrl) {
      return false;
    }

    void writeClipboardImage(imageUrl).then((didCopy) => {
      if (didCopy) {
        showHintToastSuccess("Image yanked", imageUrl);
      } else {
        showHintToastError("Could not yank image", "Clipboard access was denied or unsupported.");
      }
    });
    return true;
  }

  if (mode === "new-tab" && target.linkUrl) {
    dispatchFocusIndicator(target.element);
    const newWindow = window.open(target.linkUrl, "_blank", "noopener,noreferrer");
    if (newWindow) {
      return true;
    }
  }

  if (mode === "right-click") {
    dispatchFocusIndicator(target.element);
    dispatchSyntheticRightClickEvents(target.element);
    return true;
  }

  if (shouldFocusBeforeActivation(target.element)) {
    focusTargetElement(target.element);
  }

  if (typeof target.element.click === "function") {
    if (!shouldFocusBeforeActivation(target.element)) {
      dispatchFocusIndicator(target.element);
    }

    dispatchSyntheticPressEvents(target.element);
    target.element.click();

    return true;
  }

  if (target.linkUrl) {
    dispatchFocusIndicator(target.element);
    window.location.assign(target.linkUrl);
    return true;
  }

  return false;
};