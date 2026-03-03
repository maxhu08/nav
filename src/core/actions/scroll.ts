const SCROLL_STEP_SIZE = 60;

let activatedElement: Element | null = null;

type ScrollAxis = "x" | "y";

const scrollState = {
  time: 0,
  lastEvent: null as KeyboardEvent | null,
  keyDownCode: null as string | null
};

const scrollProperties = {
  x: {
    axisName: "scrollLeft",
    max: "scrollWidth",
    viewSize: "clientWidth"
  },
  y: {
    axisName: "scrollTop",
    max: "scrollHeight",
    viewSize: "clientHeight"
  }
} satisfies Record<
  ScrollAxis,
  {
    axisName: "scrollLeft" | "scrollTop";
    max: "scrollWidth" | "scrollHeight";
    viewSize: "clientWidth" | "clientHeight";
  }
>;

const getScrollingElement = (): HTMLElement | null => {
  const element = document.scrollingElement ?? document.body;
  return element instanceof HTMLElement ? element : null;
};

const getEventTarget = (event: Event): Element | null => {
  const [target] = event.composedPath();
  return target instanceof Element ? target : null;
};

const getContainingElement = (element: Element): Element | null => {
  if (element.parentElement) {
    return element.parentElement;
  }

  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
};

const getSign = (value: number): -1 | 0 | 1 => {
  if (!value) {
    return 0;
  }

  return value < 0 ? -1 : 1;
};

const getDimension = (
  element: HTMLElement,
  direction: ScrollAxis,
  amount: number | "max" | "viewSize"
): number => {
  if (typeof amount === "number") {
    return amount;
  }

  if (amount === "viewSize" && element === getScrollingElement()) {
    return direction === "x" ? window.innerWidth : window.innerHeight;
  }

  return element[scrollProperties[direction][amount]];
};

const performScroll = (element: Element, direction: ScrollAxis, amount: number): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const axisName = scrollProperties[direction].axisName;
  const before = element[axisName];

  if (element.scrollBy) {
    const scrollArg =
      direction === "x"
        ? { left: amount, behavior: "instant" as const }
        : { top: amount, behavior: "instant" as const };
    element.scrollBy(scrollArg);
  } else {
    element[axisName] += amount;
  }

  return element[axisName] !== before;
};

const shouldScroll = (element: Element, direction: ScrollAxis): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.getPropertyValue(`overflow-${direction}`) === "hidden") {
    return false;
  }

  if (["hidden", "collapse"].includes(computedStyle.getPropertyValue("visibility"))) {
    return false;
  }

  if (computedStyle.getPropertyValue("display") === "none") {
    return false;
  }

  return true;
};

const doesScroll = (
  element: Element,
  direction: ScrollAxis,
  amount: number | "max" | "viewSize",
  factor: number
): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  let delta = factor * getDimension(element, direction, amount);
  delta = getSign(delta || -1);

  return performScroll(element, direction, delta) && performScroll(element, direction, -delta);
};

const isScrollableElement = (
  element: Element,
  direction: ScrollAxis = "y",
  amount: number | "max" | "viewSize" = 1,
  factor = 1
): boolean => {
  return doesScroll(element, direction, amount, factor) && shouldScroll(element, direction);
};

const findScrollableElement = (
  element: Element,
  direction: ScrollAxis,
  amount: number | "max" | "viewSize",
  factor: number
): HTMLElement | null => {
  const scrollingElement = getScrollingElement();

  while (element !== scrollingElement && !isScrollableElement(element, direction, amount, factor)) {
    element = getContainingElement(element) ?? scrollingElement ?? element;
  }

  return element instanceof HTMLElement ? element : scrollingElement;
};

const getVisibleArea = (element: Element): number => {
  if (!(element instanceof HTMLElement)) {
    return 0;
  }

  const rect = element.getBoundingClientRect();
  const visibleWidth = Math.max(
    0,
    Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0)
  );
  const visibleHeight = Math.max(
    0,
    Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
  );
  return visibleWidth * visibleHeight;
};

const firstScrollableElement = (element: Element | null = null): HTMLElement | null => {
  if (!element) {
    const scrollingElement = getScrollingElement();
    if (
      scrollingElement &&
      (doesScroll(scrollingElement, "y", 1, 1) || doesScroll(scrollingElement, "y", -1, 1))
    ) {
      return scrollingElement;
    }

    element = document.body ?? scrollingElement;
  }

  if (!(element instanceof HTMLElement)) {
    return null;
  }

  if (doesScroll(element, "y", 1, 1) || doesScroll(element, "y", -1, 1)) {
    return element;
  }

  const children = Array.from(element.children)
    .map((child) => ({ element: child, area: getVisibleArea(child) }))
    .filter(({ area }) => area > 0)
    .sort((a, b) => b.area - a.area);

  for (const child of children) {
    const found = firstScrollableElement(child.element);
    if (found) {
      return found;
    }
  }

  return null;
};

const checkVisibility = (element: HTMLElement): void => {
  if (!(activatedElement instanceof HTMLElement)) {
    return;
  }

  const rect = activatedElement.getBoundingClientRect();
  if (
    rect.bottom < 0 ||
    rect.top > window.innerHeight ||
    rect.right < 0 ||
    rect.left > window.innerWidth
  ) {
    activatedElement = element;
  }
};

const MIN_CALIBRATION = 0.5;
const MAX_CALIBRATION = 1.6;
const CALIBRATION_BOUNDARY = 150;

const resetScrollState = (): void => {
  scrollState.time = 0;
  scrollState.lastEvent = null;
  scrollState.keyDownCode = null;
  activatedElement = null;
};

const wouldNotInitiateScroll = (): boolean => {
  return scrollState.lastEvent?.repeat === true;
};

const animateScroll = (
  element: HTMLElement,
  direction: ScrollAxis,
  amount: number,
  continuous = true
): boolean => {
  if (!amount) {
    return false;
  }

  if (wouldNotInitiateScroll()) {
    return false;
  }

  const activationTime = ++scrollState.time;
  const keyIsStillDown = () =>
    activationTime === scrollState.time && scrollState.keyDownCode != null;

  const sign = getSign(amount);
  const absoluteAmount = Math.abs(amount);
  const duration = Math.max(100, 20 * Math.log(absoluteAmount));

  let totalDelta = 0;
  let totalElapsed = 0;
  let calibration = 1;
  let previousTimestamp: number | null = null;

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
      MIN_CALIBRATION <= calibration &&
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
    delta = keyIsStillDown() ? delta : Math.max(0, Math.min(delta, absoluteAmount - totalDelta));

    if (delta && performScroll(element, direction, sign * delta)) {
      totalDelta += delta;
      requestAnimationFrame(animate);
      return;
    }

    checkVisibility(element);
  };

  if (!continuous) {
    ++scrollState.time;
  }

  requestAnimationFrame(animate);
  return true;
};

const ensureActivatedElement = (): HTMLElement | null => {
  const scrollingElement = getScrollingElement();

  if (!activatedElement) {
    activatedElement = (scrollingElement && firstScrollableElement()) || scrollingElement;
  }

  return activatedElement instanceof HTMLElement ? activatedElement : null;
};

const scrollBy = (
  direction: ScrollAxis,
  amount: number | "viewSize",
  factor = 1,
  continuous = true
): boolean => {
  const baseElement = ensureActivatedElement();
  if (!baseElement) {
    return false;
  }

  if (wouldNotInitiateScroll()) {
    return false;
  }

  const element = findScrollableElement(baseElement, direction, amount, factor);
  if (!element) {
    return false;
  }

  const elementAmount = factor * getDimension(element, direction, amount);
  activatedElement = element;
  return animateScroll(element, direction, elementAmount, continuous);
};

const scrollTo = (direction: ScrollAxis, pos: number | "max"): boolean => {
  const baseElement = ensureActivatedElement();
  if (!baseElement) {
    return false;
  }

  const element = findScrollableElement(baseElement, direction, pos, 1);
  if (!element) {
    return false;
  }

  const amount =
    getDimension(element, direction, pos) - element[scrollProperties[direction].axisName];
  activatedElement = element;
  return animateScroll(element, direction, amount);
};

export const installScrollTracking = (): void => {
  resetScrollState();

  document.addEventListener(
    "click",
    (event) => {
      activatedElement = getEventTarget(event);
    },
    true
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (!event.repeat) {
        scrollState.time += 1;
      }

      scrollState.keyDownCode = event.code;
      scrollState.lastEvent = event;
    },
    true
  );

  window.addEventListener(
    "keyup",
    (event) => {
      if (event.code === scrollState.keyDownCode) {
        scrollState.keyDownCode = null;
        scrollState.time += 1;
      }
    },
    true
  );

  window.addEventListener(
    "blur",
    () => {
      scrollState.keyDownCode = null;
      scrollState.time += 1;
    },
    true
  );
};

export const scrollDown = (count = 1): boolean => {
  return scrollBy("y", SCROLL_STEP_SIZE * count);
};

export const scrollUp = (count = 1): boolean => {
  return scrollBy("y", -SCROLL_STEP_SIZE * count);
};

export const scrollHalfPageDown = (count = 1): boolean => {
  return scrollBy("y", "viewSize", 0.5 * count);
};

export const scrollHalfPageUp = (count = 1): boolean => {
  return scrollBy("y", "viewSize", -0.5 * count);
};

export const scrollLeft = (count = 1): boolean => {
  return scrollBy("x", -SCROLL_STEP_SIZE * count);
};

export const scrollRight = (count = 1): boolean => {
  return scrollBy("x", SCROLL_STEP_SIZE * count);
};

export const scrollToTop = (count = 1): boolean => {
  return scrollTo("y", (count - 1) * SCROLL_STEP_SIZE);
};

export const scrollToBottom = (): boolean => {
  return scrollTo("y", "max");
};
