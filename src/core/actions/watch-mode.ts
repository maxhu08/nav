import { getDeepActiveElement } from "~/src/core/utils/isEditableTarget";
import { FOCUS_INDICATOR_EVENT, WATCH_HINTS_ID } from "~/src/core/utils/get-ui";

type WatchControllerDeps = {
  isWatchMode: () => boolean;
  setMode: (mode: "normal" | "watch") => void;
  getActionSequence: (
    actionName: "toggle-fullscreen" | "toggle-play-pause",
    fallback: string
  ) => string;
};

const MARKER_STYLE_ATTRIBUTE = "data-nav-hint-marker";
const MARKER_VARIANT_STYLE_ATTRIBUTE = "data-nav-hint-marker-variant";
const LETTER_STYLE_ATTRIBUTE = "data-nav-hint-marker-letter";
const WATCH_FULLSCREEN_ICON_PATH =
  "M8 3V5H4V9H2V3H8ZM2 21V15H4V19H8V21H2ZM22 21H16V19H20V15H22V21ZM22 9H20V5H16V3H22V9Z";
const WATCH_PLAY_ICON_PATH =
  "M8 18.3915V5.60846L18.2264 12L8 18.3915ZM6 3.80421V20.1957C6 20.9812 6.86395 21.46 7.53 21.0437L20.6432 12.848C21.2699 12.4563 21.2699 11.5436 20.6432 11.152L7.53 2.95621C6.86395 2.53993 6 3.01878 6 3.80421Z";
const WATCH_PAUSE_ICON_PATH = "M6 3H8V21H6V3ZM16 3H18V21H16V3Z";

const isVideoVisible = (video: HTMLVideoElement): boolean => {
  const bounds = video.getBoundingClientRect();

  if (bounds.width < 1 || bounds.height < 1) {
    return false;
  }

  if (
    bounds.bottom < 0 ||
    bounds.right < 0 ||
    bounds.top > window.innerHeight ||
    bounds.left > window.innerWidth
  ) {
    return false;
  }

  const styles = window.getComputedStyle(video);
  return styles.display !== "none" && styles.visibility !== "hidden";
};

export const createWatchController = (deps: WatchControllerDeps) => {
  let watchVideoElement: HTMLVideoElement | null = null;
  let watchShowCapitalizedLetters = false;

  const createWatchIcon = (path: string): SVGSVGElement => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "1em");
    svg.setAttribute("height", "1em");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");

    const node = document.createElementNS("http://www.w3.org/2000/svg", "path");
    node.setAttribute("d", path);
    svg.append(node);

    return svg;
  };

  const createWatchHintKey = (key: string, icons: SVGSVGElement[] = []): HTMLSpanElement => {
    const marker = document.createElement("span");
    marker.setAttribute(MARKER_STYLE_ATTRIBUTE, "true");
    marker.setAttribute(MARKER_VARIANT_STYLE_ATTRIBUTE, "watch-action");
    marker.style.display = "inline-flex";
    marker.style.alignItems = "center";
    marker.style.justifyContent = "center";
    marker.style.flexDirection = "column";
    marker.style.gap = "0.45em";
    marker.style.width = "88px";
    marker.style.height = "88px";
    marker.style.padding = "10px";
    marker.style.borderRadius = "12px";
    marker.style.fontSize = "34px";
    marker.style.fontWeight = "800";
    marker.style.letterSpacing = "0";
    marker.style.lineHeight = "1";
    marker.style.position = "static";
    marker.style.left = "auto";
    marker.style.top = "auto";
    marker.style.transform = "none";

    const display = watchShowCapitalizedLetters ? key.toUpperCase() : key.toLowerCase();
    const label = document.createElement("span");
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.gap = "0.08em";
    label.style.fontSize = "15px";
    label.style.fontWeight = "800";
    label.style.lineHeight = "1";

    for (const char of Array.from(display)) {
      const letter = document.createElement("span");
      letter.textContent = char;
      letter.setAttribute(LETTER_STYLE_ATTRIBUTE, "pending");
      label.append(letter);
    }

    for (const icon of icons) {
      marker.append(icon);
    }

    marker.append(label);

    return marker;
  };

  const showWatchActivationIndicator = (video: HTMLVideoElement): void => {
    window.dispatchEvent(
      new CustomEvent(FOCUS_INDICATOR_EVENT, {
        detail: { element: video }
      })
    );
  };

  const getWatchHintsOverlay = (): HTMLDivElement => {
    const existingOverlay = document.getElementById(WATCH_HINTS_ID);
    if (existingOverlay instanceof HTMLDivElement) {
      return existingOverlay;
    }

    const overlay = document.createElement("div");
    overlay.id = WATCH_HINTS_ID;
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.display = "none";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "2147483646";
    overlay.style.alignItems = "center";
    overlay.style.gap = "12px";
    overlay.style.color = "#f5f5f5";
    overlay.style.textTransform = "lowercase";
    overlay.style.fontFamily = '"JetBrains Mono", monospace';
    overlay.style.fontSize = "12px";
    overlay.style.fontWeight = "700";
    overlay.style.textShadow = "0 2px 8px rgba(0,0,0,0.5)";
    document.documentElement.append(overlay);
    return overlay;
  };

  const getTrackedWatchVideo = (): HTMLVideoElement | null => {
    if (watchVideoElement && watchVideoElement.isConnected) {
      return watchVideoElement;
    }

    watchVideoElement = null;
    return null;
  };

  const getBestWatchVideo = (): HTMLVideoElement | null => {
    const trackedVideo = getTrackedWatchVideo();
    if (trackedVideo) {
      return trackedVideo;
    }

    const activeElement = getDeepActiveElement();
    if (activeElement instanceof HTMLVideoElement && isVideoVisible(activeElement)) {
      return activeElement;
    }

    const visibleVideos = Array.from(document.querySelectorAll("video")).filter(
      (video): video is HTMLVideoElement =>
        video instanceof HTMLVideoElement && isVideoVisible(video)
    );

    if (visibleVideos.length === 0) {
      return null;
    }

    const playingVideo = visibleVideos.find((video) => !video.paused && !video.ended);
    return playingVideo ?? visibleVideos[0] ?? null;
  };

  const exitWatchMode = (): void => {
    deps.setMode("normal");
    const overlay = document.getElementById(WATCH_HINTS_ID);
    if (overlay instanceof HTMLDivElement) {
      overlay.style.display = "none";
    }
  };

  const getActiveWatchVideo = (): HTMLVideoElement | null => {
    if (!deps.isWatchMode()) {
      return null;
    }

    const trackedVideo = getTrackedWatchVideo();

    if (trackedVideo) {
      return trackedVideo;
    }

    exitWatchMode();
    return null;
  };

  const renderWatchHintsOverlay = (video: HTMLVideoElement): void => {
    const overlay = getWatchHintsOverlay();
    overlay.replaceChildren();
    const fullscreenSequence = deps.getActionSequence("toggle-fullscreen", "f");
    const pauseSequence = deps.getActionSequence("toggle-play-pause", "k");
    const playPauseIconPath =
      video.paused || video.ended ? WATCH_PLAY_ICON_PATH : WATCH_PAUSE_ICON_PATH;

    const fullscreenHint = document.createElement("div");
    fullscreenHint.style.display = "inline-flex";
    fullscreenHint.append(
      createWatchHintKey(fullscreenSequence, [createWatchIcon(WATCH_FULLSCREEN_ICON_PATH)])
    );

    const pauseHint = document.createElement("div");
    pauseHint.style.display = "inline-flex";
    pauseHint.append(createWatchHintKey(pauseSequence, [createWatchIcon(playPauseIconPath)]));

    overlay.append(fullscreenHint, pauseHint);
  };

  const showWatchHintsOverlay = (video: HTMLVideoElement): void => {
    const overlay = getWatchHintsOverlay();
    renderWatchHintsOverlay(video);
    const bounds = video.getBoundingClientRect();
    overlay.style.left = `${Math.round(bounds.left + bounds.width / 2)}px`;
    overlay.style.top = `${Math.round(bounds.top + bounds.height / 2)}px`;
    overlay.style.display = "inline-flex";
  };

  const syncWatchHintsOverlay = (): void => {
    const video = getActiveWatchVideo();

    if (!video || !isVideoVisible(video)) {
      const overlay = document.getElementById(WATCH_HINTS_ID);
      if (overlay instanceof HTMLDivElement) {
        overlay.style.display = "none";
      }
      return;
    }

    showWatchHintsOverlay(video);
  };

  return {
    setWatchShowCapitalizedLetters: (value: boolean): void => {
      watchShowCapitalizedLetters = value;
    },
    setWatchHighlightThumbnails: (value: boolean): void => {
      void value;
    },
    syncWatchHintsOverlay,
    handleWatchMediaStateChange: (): void => {
      if (!deps.isWatchMode()) {
        return;
      }

      syncWatchHintsOverlay();
    },
    getWatchActionSequences: (): { fullscreenSequence: string; pauseSequence: string } => ({
      fullscreenSequence: deps.getActionSequence("toggle-fullscreen", "f"),
      pauseSequence: deps.getActionSequence("toggle-play-pause", "k")
    }),
    isWatchModeActive: (): boolean => getActiveWatchVideo() !== null,
    exitWatchMode,
    toggleVideoControls: (): boolean => {
      if (deps.isWatchMode()) {
        exitWatchMode();
        return true;
      }

      const targetVideo = getBestWatchVideo();
      if (!targetVideo) {
        return false;
      }

      watchVideoElement = targetVideo;
      deps.setMode("watch");
      targetVideo.focus({ preventScroll: true });
      syncWatchHintsOverlay();
      return true;
    },
    toggleWatchPlayPause: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);

      if (video.paused || video.ended) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }

      exitWatchMode();
      return true;
    },
    togglePlayPause: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);

      if (video.paused || video.ended) {
        void video.play().catch(() => {});
        return true;
      }

      video.pause();
      return true;
    },
    toggleFullscreen: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);

      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
        exitWatchMode();
        return true;
      }

      if (typeof video.requestFullscreen !== "function") {
        return false;
      }

      void video.requestFullscreen().catch(() => {});
      exitWatchMode();
      return true;
    }
  };
};
