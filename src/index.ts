const SCROLL_STEP_SIZE = 60;
const MIN_CALIBRATION = 0.5;
const MAX_CALIBRATION = 1.6;
const CALIBRATION_BOUNDARY = 150;

let activatedElement: Element | null = null;

type ScrollDirection = "up" | "down";

const scrollState = {
  time: 0,
  keyDownCode: null as string | null,
  lastKeydownWasRepeat: false
};

function getScrollingElement(): HTMLElement | null {
  const element = document.scrollingElement ?? document.documentElement ?? document.body;
  return element instanceof HTMLElement ? element : null;
}

function getEventTarget(event: Event): Element | null {
  const [target] = event.composedPath();
  return target instanceof Element ? target : null;
}

function getParentElement(element: Element): Element | null {
  if (element.parentElement) {
    return element.parentElement;
  }

  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const editableContainer = target.closest(
    "input, textarea, select, button, [contenteditable], [contenteditable='true']"
  );

  if (!editableContainer) {
    return false;
  }

  if (editableContainer instanceof HTMLInputElement) {
    const nonTextTypes = new Set([
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit"
    ]);

    return !nonTextTypes.has(editableContainer.type);
  }

  return true;
}

function performScroll(element: Element, amount: number): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const before = element.scrollTop;
  element.scrollTop += amount;
  return element.scrollTop !== before;
}

function canScroll(element: Element, direction: ScrollDirection): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);

  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse" ||
    style.overflowY === "hidden"
  ) {
    return false;
  }

  if (element.scrollHeight <= element.clientHeight) {
    return false;
  }

  if (direction === "down") {
    return element.scrollTop + element.clientHeight < element.scrollHeight;
  }

  return element.scrollTop > 0;
}

function findScrollableElement(
  start: Element | null,
  direction: ScrollDirection
): HTMLElement | null {
  let current = start;
  const scrollingElement = getScrollingElement();

  while (current) {
    if (canScroll(current, direction) && current instanceof HTMLElement) {
      return current;
    }

    if (current === scrollingElement) {
      break;
    }

    current = getParentElement(current);
  }

  if (scrollingElement && canScroll(scrollingElement, direction)) {
    return scrollingElement;
  }

  return null;
}

function smoothScroll(element: HTMLElement, amount: number, keyCode: string): void {
  if (amount === 0) {
    return;
  }

  if (scrollState.lastKeydownWasRepeat) {
    return;
  }

  const activationTime = ++scrollState.time;
  const sign = Math.sign(amount);
  const absoluteAmount = Math.abs(amount);
  const duration = Math.max(100, 20 * Math.log(absoluteAmount));

  let totalDelta = 0;
  let totalElapsed = 0;
  let calibration = 1;
  let previousTimestamp: number | null = null;

  const keyIsStillDown = () =>
    scrollState.time === activationTime && scrollState.keyDownCode === keyCode;

  const animate = (timestamp: number) => {
    if (previousTimestamp == null) {
      previousTimestamp = timestamp;
    }

    if (timestamp === previousTimestamp) {
      requestAnimationFrame(animate);
      return;
    }

    const elapsed = timestamp - previousTimestamp;
    totalElapsed += elapsed;
    previousTimestamp = timestamp;

    if (
      keyIsStillDown() &&
      totalElapsed >= 75 &&
      calibration >= MIN_CALIBRATION &&
      calibration <= MAX_CALIBRATION
    ) {
      if (1.05 * calibration * absoluteAmount < CALIBRATION_BOUNDARY) {
        calibration *= 1.05;
      }

      if (CALIBRATION_BOUNDARY < 0.95 * calibration * absoluteAmount) {
        calibration *= 0.95;
      }
    }

    let delta = Math.ceil(absoluteAmount * (elapsed / duration) * calibration);

    if (!keyIsStillDown()) {
      delta = Math.max(0, Math.min(delta, absoluteAmount - totalDelta));
    }

    if (delta > 0 && performScroll(element, sign * delta)) {
      totalDelta += delta;
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

function scroll(direction: ScrollDirection, keyCode: string): boolean {
  const start = activatedElement ?? document.activeElement ?? getScrollingElement();
  const scrollableElement = findScrollableElement(start, direction);

  if (!scrollableElement) {
    return false;
  }

  const amount = direction === "down" ? SCROLL_STEP_SIZE : -SCROLL_STEP_SIZE;
  activatedElement = scrollableElement;
  smoothScroll(scrollableElement, amount, keyCode);
  return true;
}

document.addEventListener(
  "click",
  (event) => {
    activatedElement = getEventTarget(event);
  },
  true
);

document.addEventListener(
  "keydown",
  (event) => {
    scrollState.keyDownCode = event.code;
    scrollState.lastKeydownWasRepeat = event.repeat;

    if (!event.repeat) {
      scrollState.time += 1;
    }
  },
  true
);

document.addEventListener(
  "keyup",
  (event) => {
    if (event.code === scrollState.keyDownCode) {
      scrollState.keyDownCode = null;
      scrollState.lastKeydownWasRepeat = false;
      scrollState.time += 1;
    }
  },
  true
);

window.addEventListener(
  "blur",
  () => {
    scrollState.keyDownCode = null;
    scrollState.lastKeydownWasRepeat = false;
    scrollState.time += 1;
  },
  true
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    if (event.key !== "j" && event.key !== "k") {
      return;
    }

    const didScroll = scroll(event.key === "j" ? "down" : "up", event.code);

    if (!didScroll) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  },
  true
);
