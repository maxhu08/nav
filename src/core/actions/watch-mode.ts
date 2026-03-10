import { getDeepActiveElement } from "~/src/core/utils/isEditableTarget";
import { FOCUS_INDICATOR_EVENT, WATCH_HINTS_ID } from "~/src/core/utils/get-ui";

type WatchControllerDeps = {
  isWatchMode: () => boolean;
  setMode: (mode: "normal" | "watch") => void;
  getActionSequence: (
    actionName:
      | "toggle-fullscreen"
      | "toggle-play-pause"
      | "toggle-loop"
      | "toggle-mute"
      | "toggle-captions",
    fallback: string
  ) => string;
};

type WatchActionTileOptions = {
  iconPath: string;
  sequence: string;
  compact?: boolean;
};

const MARKER_STYLE_ATTRIBUTE = "data-nav-hint-marker";
const MARKER_VARIANT_STYLE_ATTRIBUTE = "data-nav-hint-marker-variant";
const LETTER_STYLE_ATTRIBUTE = "data-nav-hint-marker-letter";

const WATCH_FULLSCREEN_ICON_PATH =
  "M8 3V5H4V9H2V3H8ZM2 21V15H4V19H8V21H2ZM22 21H16V19H20V15H22V21ZM22 9H20V5H16V3H22V9Z";
const WATCH_PLAY_ICON_PATH =
  "M8 18.3915V5.60846L18.2264 12L8 18.3915ZM6 3.80421V20.1957C6 20.9812 6.86395 21.46 7.53 21.0437L20.6432 12.848C21.2699 12.4563 21.2699 11.5436 20.6432 11.152L7.53 2.95621C6.86395 2.53993 6 3.01878 6 3.80421Z";
const WATCH_PAUSE_ICON_PATH = "M6 3H8V21H6V3ZM16 3H18V21H16V3Z";
const WATCH_LOOP_ICON_PATH =
  "M6 4H21C21.5523 4 22 4.44772 22 5V12H20V6H6V9L1 5L6 1V4ZM18 20H3C2.44772 20 2 19.5523 2 19V12H4V18H18V15L23 19L18 23V20Z";
const WATCH_CAPTIONS_ICON_PATH =
  "M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM9 8C10.1045 8 11.1049 8.44841 11.829 9.173L10.4153 10.5866C10.0534 10.2241 9.55299 10 9 10C7.895 10 7 10.895 7 12C7 13.105 7.895 14 9 14C9.5525 14 10.0525 13.7762 10.4144 13.4144L11.828 14.828C11.104 15.552 10.104 16 9 16C6.792 16 5 14.208 5 12C5 9.792 6.792 8 9 8ZM16 8C17.1045 8 18.1049 8.44841 18.829 9.173L17.4153 10.5866C17.0534 10.2241 16.553 10 16 10C14.895 10 14 10.895 14 12C14 13.105 14.895 14 16 14C16.5525 14 17.0525 13.7762 17.4144 13.4144L18.828 14.828C18.104 15.552 17.104 16 16 16C13.792 16 12 14.208 12 12C12 9.792 13.792 8 16 8Z";
const WATCH_VOLUME_UP_ICON_PATH =
  "M6.60282 10.0001L10 7.22056V16.7796L6.60282 14.0001H3V10.0001H6.60282ZM2 16.0001H5.88889L11.1834 20.3319C11.2727 20.405 11.3846 20.4449 11.5 20.4449C11.7761 20.4449 12 20.2211 12 19.9449V4.05519C12 3.93977 11.9601 3.8279 11.887 3.73857C11.7121 3.52485 11.3971 3.49335 11.1834 3.66821L5.88889 8.00007H2C1.44772 8.00007 1 8.44778 1 9.00007V15.0001C1 15.5524 1.44772 16.0001 2 16.0001ZM23 12C23 15.292 21.5539 18.2463 19.2622 20.2622L17.8445 18.8444C19.7758 17.1937 21 14.7398 21 12C21 9.26016 19.7758 6.80629 17.8445 5.15557L19.2622 3.73779C21.5539 5.75368 23 8.70795 23 12ZM18 12C18 10.0883 17.106 8.38548 15.7133 7.28673L14.2842 8.71584C15.3213 9.43855 16 10.64 16 12C16 13.36 15.3213 14.5614 14.2842 15.2841L15.7133 16.7132C17.106 15.6145 18 13.9116 18 12Z";
const WATCH_VOLUME_MUTE_ICON_PATH =
  "M10 7.22056L6.60282 10.0001H3V14.0001H6.60282L10 16.7796V7.22056ZM5.88889 16.0001H2C1.44772 16.0001 1 15.5524 1 15.0001V9.00007C1 8.44778 1.44772 8.00007 2 8.00007H5.88889L11.1834 3.66821C11.3971 3.49335 11.7121 3.52485 11.887 3.73857C11.9601 3.8279 12 3.93977 12 4.05519V19.9449C12 20.2211 11.7761 20.4449 11.5 20.4449C11.3846 20.4449 11.2727 20.405 11.1834 20.3319L5.88889 16.0001ZM20.4142 12.0001L23.9497 15.5356L22.5355 16.9498L19 13.4143L15.4645 16.9498L14.0503 15.5356L17.5858 12.0001L14.0503 8.46454L15.4645 7.05032L19 10.5859L22.5355 7.05032L23.9497 8.46454L20.4142 12.0001Z";

const WATCH_OVERLAY_GAP_PX = 12;
const WATCH_LARGE_TILE_SIZE_PX = 88;
const WATCH_SMALL_TILE_HEIGHT_PX = 48;
const WATCH_TILE_BORDER_RADIUS_PX = 12;
const WATCH_COMPACT_TILE_BORDER_RADIUS_PX = 8;
const WATCH_LARGE_ICON_SIZE_PX = 34;
const WATCH_SMALL_ICON_SIZE_PX = 22;
const WATCH_LABEL_FONT_SIZE_PX = 15;
const WATCH_TILE_FONT_WEIGHT = "800";

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

const applyTileBaseStyles = (tile: HTMLElement): void => {
  tile.setAttribute(MARKER_STYLE_ATTRIBUTE, "true");
  tile.setAttribute(MARKER_VARIANT_STYLE_ATTRIBUTE, "watch-action");
  tile.style.display = "inline-flex";
  tile.style.alignItems = "center";
  tile.style.justifyContent = "center";
  tile.style.position = "static";
  tile.style.left = "auto";
  tile.style.top = "auto";
  tile.style.transform = "none";
  tile.style.textShadow = "none";
  tile.style.letterSpacing = "0";
  tile.style.lineHeight = "1";
  tile.style.boxSizing = "border-box";
  tile.style.minWidth = "0";
  tile.style.overflow = "hidden";
};

const createWatchIcon = (path: string, sizePx: number): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(sizePx));
  svg.setAttribute("height", String(sizePx));
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.style.flex = "0 0 auto";
  svg.style.opacity = "0.95";

  const node = document.createElementNS("http://www.w3.org/2000/svg", "path");
  node.setAttribute("d", path);
  svg.append(node);

  return svg;
};

export const createWatchController = (deps: WatchControllerDeps) => {
  let watchVideoElement: HTMLVideoElement | null = null;
  let watchShowCapitalizedLetters = false;

  const isInteractiveControl = (element: HTMLElement): boolean => {
    if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return !element.disabled;
    }

    const ariaDisabled = element.getAttribute("aria-disabled");
    return ariaDisabled !== "true";
  };

  const isLikelyFullscreenControl = (element: HTMLElement): boolean => {
    const className = typeof element.className === "string" ? element.className : "";
    const label = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.getAttribute("data-title-no-tooltip"),
      element.getAttribute("data-tooltip-target-id"),
      element.textContent
    ]
      .join(" ")
      .toLowerCase();

    return (
      className.toLowerCase().includes("fullscreen") ||
      label.includes("fullscreen") ||
      label.includes("full screen") ||
      label.includes("exit fullscreen") ||
      label.includes("exit full screen")
    );
  };

  const findSiteFullscreenControl = (video: HTMLVideoElement): HTMLElement | null => {
    const containerCandidates = [
      video.closest(".html5-video-player"),
      video.closest("[class*='player' i]"),
      video.closest("[id*='player' i]"),
      video.parentElement
    ].filter((candidate): candidate is HTMLElement => candidate instanceof HTMLElement);

    const selectors = [
      ".ytp-fullscreen-button",
      "[aria-label*='fullscreen' i]",
      "[title*='fullscreen' i]",
      "[class*='fullscreen' i]",
      "[data-testid*='fullscreen' i]"
    ].join(", ");

    for (const root of containerCandidates) {
      const controls = Array.from(root.querySelectorAll(selectors)).filter(
        (element): element is HTMLElement => element instanceof HTMLElement
      );

      for (const control of controls) {
        if (control.closest(`#${WATCH_HINTS_ID}`)) {
          continue;
        }

        const bounds = control.getBoundingClientRect();
        if (bounds.width < 1 || bounds.height < 1) {
          continue;
        }

        if (!isInteractiveControl(control) || !isLikelyFullscreenControl(control)) {
          continue;
        }

        return control;
      }
    }

    return null;
  };

  const createWatchLabel = (sequence: string): HTMLSpanElement => {
    const label = document.createElement("span");
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.justifyContent = "center";
    label.style.gap = "0.08em";
    label.style.fontSize = `${WATCH_LABEL_FONT_SIZE_PX}px`;
    label.style.fontWeight = WATCH_TILE_FONT_WEIGHT;
    label.style.lineHeight = "1";
    label.style.textShadow = "none";

    const display = watchShowCapitalizedLetters ? sequence.toUpperCase() : sequence.toLowerCase();

    for (const char of Array.from(display)) {
      const letter = document.createElement("span");
      letter.textContent = char;
      letter.setAttribute(LETTER_STYLE_ATTRIBUTE, "pending");
      letter.style.textShadow = "none";
      label.append(letter);
    }

    return label;
  };

  const createWatchActionTile = ({
    iconPath,
    sequence,
    compact = false
  }: WatchActionTileOptions): HTMLDivElement => {
    const tile = document.createElement("div");
    applyTileBaseStyles(tile);

    const iconSize = compact ? WATCH_SMALL_ICON_SIZE_PX : WATCH_LARGE_ICON_SIZE_PX;
    const icon = createWatchIcon(iconPath, iconSize);
    const label = createWatchLabel(sequence);

    if (compact) {
      tile.style.flexDirection = "row";
      tile.style.gap = "0.45em";
      tile.style.width = "100%";
      tile.style.height = `${WATCH_SMALL_TILE_HEIGHT_PX}px`;
      tile.style.padding = "10px";
      tile.style.borderRadius = `${WATCH_COMPACT_TILE_BORDER_RADIUS_PX}px`;
    } else {
      tile.style.flexDirection = "column";
      tile.style.gap = "0.45em";
      tile.style.width = "100%";
      tile.style.aspectRatio = "1 / 1";
      tile.style.padding = "10px";
      tile.style.borderRadius = `${WATCH_TILE_BORDER_RADIUS_PX}px`;
    }

    tile.append(icon, label);
    return tile;
  };

  const createWatchActionGrid = (): HTMLDivElement => {
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(6, minmax(0, 1fr))";
    grid.style.gridTemplateAreas = `
      "fullscreen fullscreen fullscreen pause pause pause"
      "mute mute captions captions loop loop"
    `;
    grid.style.columnGap = `${WATCH_OVERLAY_GAP_PX}px`;
    grid.style.rowGap = `${WATCH_OVERLAY_GAP_PX}px`;
    grid.style.width = `${WATCH_LARGE_TILE_SIZE_PX * 2 + WATCH_OVERLAY_GAP_PX}px`;
    grid.style.maxWidth = "100%";
    grid.style.alignItems = "stretch";
    return grid;
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

  const getToggleableTextTracks = (video: HTMLVideoElement): TextTrack[] => {
    return Array.from(video.textTracks).filter((track) => track.kind !== "metadata");
  };

  const toggleWatchVideoTextTracks = (video: HTMLVideoElement): boolean => {
    const tracks = getToggleableTextTracks(video);
    if (tracks.length === 0) {
      return false;
    }

    const hasVisibleTrack = tracks.some((track) => track.mode === "showing");

    for (const track of tracks) {
      track.mode = hasVisibleTrack ? "disabled" : "showing";
    }

    return true;
  };

  const renderWatchHintsOverlay = (video: HTMLVideoElement): void => {
    const overlay = getWatchHintsOverlay();
    overlay.replaceChildren();

    const fullscreenSequence = deps.getActionSequence("toggle-fullscreen", "f");
    const pauseSequence = deps.getActionSequence("toggle-play-pause", "e");
    const loopSequence = deps.getActionSequence("toggle-loop", "l");
    const muteSequence = deps.getActionSequence("toggle-mute", "m");
    const captionsSequence = deps.getActionSequence("toggle-captions", "c");

    const playPauseIconPath =
      video.paused || video.ended ? WATCH_PLAY_ICON_PATH : WATCH_PAUSE_ICON_PATH;
    const muteIconPath = video.muted ? WATCH_VOLUME_MUTE_ICON_PATH : WATCH_VOLUME_UP_ICON_PATH;

    const grid = createWatchActionGrid();

    const fullscreenTile = createWatchActionTile({
      iconPath: WATCH_FULLSCREEN_ICON_PATH,
      sequence: fullscreenSequence
    });
    fullscreenTile.style.gridArea = "fullscreen";

    const pauseTile = createWatchActionTile({
      iconPath: playPauseIconPath,
      sequence: pauseSequence
    });
    pauseTile.style.gridArea = "pause";

    const muteTile = createWatchActionTile({
      iconPath: muteIconPath,
      sequence: muteSequence,
      compact: true
    });
    muteTile.style.gridArea = "mute";

    const captionsTile = createWatchActionTile({
      iconPath: WATCH_CAPTIONS_ICON_PATH,
      sequence: captionsSequence,
      compact: true
    });
    captionsTile.style.gridArea = "captions";

    const loopTile = createWatchActionTile({
      iconPath: WATCH_LOOP_ICON_PATH,
      sequence: loopSequence,
      compact: true
    });
    loopTile.style.gridArea = "loop";

    grid.append(fullscreenTile, pauseTile, muteTile, captionsTile, loopTile);
    overlay.append(grid);
  };

  const showWatchHintsOverlay = (video: HTMLVideoElement): void => {
    const overlay = getWatchHintsOverlay();
    renderWatchHintsOverlay(video);

    const bounds = video.getBoundingClientRect();
    overlay.style.left = `${Math.round(bounds.left + bounds.width / 2)}px`;
    overlay.style.top = `${Math.round(bounds.top + bounds.height / 2)}px`;
    overlay.style.display = "block";
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
    syncWatchHintsOverlay,
    handleWatchMediaStateChange: (): void => {
      if (!deps.isWatchMode()) {
        return;
      }

      syncWatchHintsOverlay();
    },
    getWatchActionSequences: (): Record<
      "toggle-fullscreen" | "toggle-play-pause" | "toggle-loop" | "toggle-mute" | "toggle-captions",
      string
    > => ({
      "toggle-fullscreen": deps.getActionSequence("toggle-fullscreen", "f"),
      "toggle-play-pause": deps.getActionSequence("toggle-play-pause", "e"),
      "toggle-loop": deps.getActionSequence("toggle-loop", "l"),
      "toggle-mute": deps.getActionSequence("toggle-mute", "m"),
      "toggle-captions": deps.getActionSequence("toggle-captions", "c")
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
    toggleWatchLoop: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      video.loop = !video.loop;
      exitWatchMode();
      return true;
    },
    toggleWatchMute: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      video.muted = !video.muted;
      exitWatchMode();
      return true;
    },
    toggleWatchCaptions: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);

      if (!toggleWatchVideoTextTracks(video)) {
        return false;
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

      const siteFullscreenControl = findSiteFullscreenControl(video);
      if (siteFullscreenControl) {
        siteFullscreenControl.click();
        exitWatchMode();
        return true;
      }

      if (typeof video.requestFullscreen !== "function") {
        return false;
      }

      void video.requestFullscreen().catch(() => {});
      exitWatchMode();
      return true;
    },
    toggleLoop: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      video.loop = !video.loop;
      return true;
    },
    toggleMute: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      video.muted = !video.muted;
      return true;
    },
    toggleCaptions: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      return toggleWatchVideoTextTracks(video);
    }
  };
};
