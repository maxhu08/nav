import {
  getDeepActiveElement,
  isEditableElement,
  isSelectableElement
} from "~/src/core/utils/is-editable-target";

const IS_MAC = navigator.userAgent.includes("Mac");
const BLURRING_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit"
]);

type HintActivatorOptions = {
  focusIndicatorEvent: string;
  selectableActivatedEvent: string;
};

const shouldBlurAfterActivation = (element: HTMLElement): boolean =>
  element instanceof HTMLButtonElement ||
  (element instanceof HTMLInputElement && BLURRING_INPUT_TYPES.has(element.type)) ||
  element.getAttribute("role") === "button";

const isElementDeepActive = (element: HTMLElement): boolean => getDeepActiveElement() === element;

const focusElement = (element: HTMLElement): void => {
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
};

const simulateMouseInteraction = (
  element: HTMLElement,
  eventName: string,
  modifiers: MouseEventInit
): void => {
  const baseInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    detail: 1,
    ...modifiers
  };

  if (eventName.startsWith("pointer") && typeof PointerEvent !== "undefined") {
    element.dispatchEvent(
      new PointerEvent(eventName, {
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        ...baseInit
      })
    );
    return;
  }

  element.dispatchEvent(new MouseEvent(eventName, baseInit));
};

export const createHintActivator = ({
  focusIndicatorEvent,
  selectableActivatedEvent
}: HintActivatorOptions) => {
  const dispatchFocusIndicator = (element: HTMLElement): void => {
    window.dispatchEvent(
      new CustomEvent(focusIndicatorEvent, {
        detail: { element }
      })
    );
  };

  const simulateSelect = (element: HTMLElement): boolean => {
    const activeElement = getDeepActiveElement();
    if (activeElement === element && isEditableElement(activeElement)) {
      dispatchFocusIndicator(element);
      return true;
    }

    focusElement(element);

    if (!isElementDeepActive(element)) {
      element.click();
      focusElement(element);
    }

    const didFocusImmediately = isElementDeepActive(element);

    if (!didFocusImmediately) {
      window.requestAnimationFrame(() => {
        if (isElementDeepActive(element)) {
          return;
        }

        focusElement(element);
      });
    }

    dispatchFocusIndicator(element);

    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      return didFocusImmediately;
    }

    if (element instanceof HTMLTextAreaElement && element.value.includes("\n")) {
      return didFocusImmediately;
    }

    try {
      if (element.selectionStart === 0 && element.selectionEnd === 0) {
        element.setSelectionRange(element.value.length, element.value.length);
      }
    } catch {
      // Ignore elements without stable selection APIs.
    }

    return didFocusImmediately;
  };

  const simulateClick = (element: HTMLElement, modifiers: MouseEventInit = {}): void => {
    dispatchFocusIndicator(element);

    for (const eventName of [
      "pointerover",
      "mouseover",
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "click"
    ]) {
      simulateMouseInteraction(element, eventName, modifiers);
    }
  };

  const clickElement = (element: HTMLElement): void => {
    simulateClick(element);

    if (document.activeElement === element && shouldBlurAfterActivation(element)) {
      element.blur();
    }
  };

  const dispatchModifiedClick = (element: HTMLElement, modifiers: MouseEventInit): void => {
    simulateClick(element, modifiers);

    if (document.activeElement === element && shouldBlurAfterActivation(element)) {
      element.blur();
    }
  };

  const openHintInCurrentTab = (element: HTMLElement): void => {
    if (isSelectableElement(element)) {
      window.focus();
      const didFocusImmediately = simulateSelect(element);
      window.dispatchEvent(
        new CustomEvent(selectableActivatedEvent, {
          detail: { didFocusImmediately }
        })
      );
      return;
    }

    if (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) {
      const previousTarget = element.target;
      if (previousTarget === "_blank") {
        element.target = "_self";
        clickElement(element);
        window.setTimeout(() => {
          element.target = previousTarget;
        }, 0);
        return;
      }
    }

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLEmbedElement ||
      element instanceof HTMLObjectElement
    ) {
      element.focus();
    }

    clickElement(element);
  };

  const openHintInNewTab = (element: HTMLElement): void => {
    dispatchModifiedClick(element, {
      ctrlKey: !IS_MAC,
      metaKey: IS_MAC
    });
  };

  return {
    dispatchFocusIndicator,
    openHintInCurrentTab,
    openHintInNewTab
  };
};