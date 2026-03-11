import {
  WATCH_CAPTIONS_ICON_PATH,
  WATCH_FULLSCREEN_ICON_PATH,
  WATCH_LOOP_ICON_PATH,
  WATCH_PAUSE_ICON_PATH,
  WATCH_PLAY_ICON_PATH,
  WATCH_VOLUME_MUTE_ICON_PATH,
  WATCH_VOLUME_UP_ICON_PATH
} from "~/src/lib/inline-icons";
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
  svg.style.color = "#000000";
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
    overlay.style.fontFamily =
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
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
