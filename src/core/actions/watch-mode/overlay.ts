import {
  WATCH_CAPTIONS_ICON_PATH,
  WATCH_FULLSCREEN_ICON_PATH,
  WATCH_LOOP_ICON_PATH,
  WATCH_PAUSE_ICON_PATH,
  WATCH_PLAY_ICON_PATH,
  WATCH_VOLUME_MUTE_ICON_PATH,
  WATCH_VOLUME_UP_ICON_PATH
} from "~/src/lib/inline-icons";
import { WATCH_HINTS_ID } from "~/src/core/utils/get-ui";
import {
  LETTER_STYLE_ATTRIBUTE,
  MARKER_STYLE_ATTRIBUTE,
  MARKER_VARIANT_STYLE_ATTRIBUTE,
  WATCH_COMPACT_TILE_BORDER_RADIUS_PX,
  WATCH_LABEL_FONT_SIZE_PX,
  WATCH_LARGE_ICON_SIZE_PX,
  WATCH_LARGE_TILE_SIZE_PX,
  WATCH_OVERLAY_GAP_PX,
  WATCH_SMALL_ICON_SIZE_PX,
  WATCH_SMALL_TILE_HEIGHT_PX,
  WATCH_TILE_BORDER_RADIUS_PX,
  WATCH_TILE_FONT_WEIGHT,
  type WatchActionTileOptions
} from "~/src/core/actions/watch-mode/shared";

type ActionSequenceName =
  | "toggle-fullscreen"
  | "toggle-play-pause"
  | "toggle-loop"
  | "toggle-mute"
  | "toggle-captions";

type WatchOverlayControllerDeps = {
  getActionSequence: (actionName: ActionSequenceName, fallback: string) => string;
  getShowCapitalizedLetters: () => boolean;
  getVideoMutedState: (video: HTMLVideoElement) => boolean;
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

export const createWatchOverlayController = ({
  getActionSequence,
  getShowCapitalizedLetters,
  getVideoMutedState
}: WatchOverlayControllerDeps) => {
  let watchOverlayRenderKey = "";

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

    const display = getShowCapitalizedLetters() ? sequence.toUpperCase() : sequence.toLowerCase();

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

    tile.style.flexDirection = compact ? "row" : "column";
    tile.style.gap = "0.45em";
    tile.style.width = "100%";
    tile.style.padding = "10px";

    if (compact) {
      tile.style.height = `${WATCH_SMALL_TILE_HEIGHT_PX}px`;
      tile.style.borderRadius = `${WATCH_COMPACT_TILE_BORDER_RADIUS_PX}px`;
    } else {
      tile.style.aspectRatio = "1 / 1";
      tile.style.borderRadius = `${WATCH_TILE_BORDER_RADIUS_PX}px`;
    }

    tile.append(icon, label);
    return tile;
  };

  const renderWatchHintsOverlay = (video: HTMLVideoElement): void => {
    const overlay = getWatchHintsOverlay();
    overlay.replaceChildren();

    const fullscreenSequence = getActionSequence("toggle-fullscreen", "f");
    const pauseSequence = getActionSequence("toggle-play-pause", "e");
    const loopSequence = getActionSequence("toggle-loop", "l");
    const muteSequence = getActionSequence("toggle-mute", "m");
    const captionsSequence = getActionSequence("toggle-captions", "c");

    const playPauseIconPath =
      video.paused || video.ended ? WATCH_PLAY_ICON_PATH : WATCH_PAUSE_ICON_PATH;
    const muteIconPath = getVideoMutedState(video)
      ? WATCH_VOLUME_MUTE_ICON_PATH
      : WATCH_VOLUME_UP_ICON_PATH;

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

  return {
    hideOverlay: (): void => {
      const overlay = document.getElementById(WATCH_HINTS_ID);
      if (overlay instanceof HTMLDivElement) {
        overlay.style.display = "none";
      }
    },
    invalidateRender: (): void => {
      watchOverlayRenderKey = "";
    },
    showOverlay: (video: HTMLVideoElement): void => {
      const overlay = getWatchHintsOverlay();
      const fullscreenSequence = getActionSequence("toggle-fullscreen", "f");
      const pauseSequence = getActionSequence("toggle-play-pause", "e");
      const loopSequence = getActionSequence("toggle-loop", "l");
      const muteSequence = getActionSequence("toggle-mute", "m");
      const captionsSequence = getActionSequence("toggle-captions", "c");
      const overlayRenderKey = [
        fullscreenSequence,
        pauseSequence,
        loopSequence,
        muteSequence,
        captionsSequence,
        getShowCapitalizedLetters() ? "caps" : "lower",
        video.paused || video.ended ? "paused" : "playing",
        getVideoMutedState(video) ? "muted" : "unmuted"
      ].join("|");

      if (overlayRenderKey !== watchOverlayRenderKey) {
        renderWatchHintsOverlay(video);
        watchOverlayRenderKey = overlayRenderKey;
      }

      const bounds = video.getBoundingClientRect();
      overlay.style.left = `${Math.round(bounds.left + bounds.width / 2)}px`;
      overlay.style.top = `${Math.round(bounds.top + bounds.height / 2)}px`;
      overlay.style.display = "block";
    }
  };
};