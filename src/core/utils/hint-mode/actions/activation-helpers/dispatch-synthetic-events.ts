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

export const dispatchSyntheticPressEventsAt = (
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

export const dispatchSyntheticPressEvents = (element: HTMLElement): void => {
  const rect = element.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;
  dispatchSyntheticPressEventsAt(element, clientX, clientY);
};

export const dispatchSyntheticRightClickEvents = (element: HTMLElement): void => {
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

export { dispatchSyntheticClickEventAt };