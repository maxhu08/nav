const controlsContainerPlaceholderEl = document.getElementById(
  "controls-container-placeholder"
) as HTMLDivElement | null;
const controlsContainerEl = document.getElementById("controls-container") as HTMLDivElement | null;
const mainEl = document.querySelector("main") as HTMLElement | null;
const FLOATING_BOTTOM_OFFSET_PX = 10;

const canHandleControls = (): boolean => {
  return !!controlsContainerPlaceholderEl && !!controlsContainerEl && !!mainEl;
};

const measureControlsHeight = (): number => {
  return controlsContainerEl?.getBoundingClientRect().height ?? 0;
};

const reserveControlsPlaceholderHeight = (): void => {
  if (!controlsContainerPlaceholderEl) {
    return;
  }

  const height = measureControlsHeight();
  if (height > 0) {
    controlsContainerPlaceholderEl.style.height = `${height}px`;
    controlsContainerPlaceholderEl.style.minHeight = `${height}px`;
  }
};

const setControlsVisibility = (isVisible: boolean): void => {
  controlsContainerEl?.classList.toggle("controls-hidden", !isVisible);
};

export const showControls = (): void => {
  if (!controlsContainerEl || !mainEl) {
    return;
  }

  const rect = mainEl.getBoundingClientRect();
  controlsContainerEl.style.left = `${rect.left}px`;
  controlsContainerEl.style.width = `${rect.width}px`;

  setControlsVisibility(true);
};

const updateFloatingControlsPosition = (): void => {
  if (!controlsContainerPlaceholderEl || !controlsContainerEl || !mainEl) {
    return;
  }

  const height = measureControlsHeight();
  controlsContainerPlaceholderEl.style.height = `${height}px`;

  controlsContainerEl.style.bottom = `${FLOATING_BOTTOM_OFFSET_PX}px`;
  const rect = mainEl.getBoundingClientRect();
  controlsContainerEl.style.left = `${rect.left}px`;
  controlsContainerEl.style.width = `${rect.width}px`;
};

export const handleControls = (): void => {
  if (!canHandleControls()) {
    return;
  }

  let isDocked = false;
  reserveControlsPlaceholderHeight();

  const syncControlsDockState = () => {
    if (!controlsContainerPlaceholderEl || !controlsContainerEl) {
      return;
    }

    const height = measureControlsHeight();
    controlsContainerPlaceholderEl.style.height = `${height}px`;

    const placeholderTop = controlsContainerPlaceholderEl.getBoundingClientRect().top;
    const dockThreshold = window.innerHeight - height - FLOATING_BOTTOM_OFFSET_PX;
    const shouldDock = placeholderTop <= dockThreshold;

    if (shouldDock) {
      controlsContainerEl.style.removeProperty("width");
      controlsContainerEl.style.removeProperty("bottom");
      controlsContainerEl.style.removeProperty("left");
      controlsContainerEl.classList.replace("fixed", "relative");
      controlsContainerEl.classList.remove("drop-shadow");
      setControlsVisibility(true);
    } else {
      updateFloatingControlsPosition();
      controlsContainerEl.classList.replace("relative", "fixed");
      controlsContainerEl.classList.add("drop-shadow");
    }

    isDocked = shouldDock;
  };

  window.addEventListener("resize", () => {
    syncControlsDockState();

    if (!isDocked) {
      updateFloatingControlsPosition();

      window.setTimeout(() => {
        updateFloatingControlsPosition();
      }, 500);
    }
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY === 0) {
      syncControlsDockState();

      if (!isDocked) {
        setControlsVisibility(false);
      }

      return;
    }

    syncControlsDockState();

    if (isDocked) {
      return;
    }

    showControls();
  });

  syncControlsDockState();
};