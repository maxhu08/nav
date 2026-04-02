import {
  WATCH_CAPTIONS_ICON_PATH,
  WATCH_FULLSCREEN_ICON_PATH,
  WATCH_LOOP_ICON_PATH,
  WATCH_PAUSE_ICON_PATH,
  WATCH_PLAY_ICON_PATH,
  WATCH_VOLUME_MUTE_ICON_PATH,
  WATCH_VOLUME_UP_ICON_PATH
} from "~/src/lib/inline-icons";
import { ensureOverlayRoot, WATCH_HINTS_ID, WATCH_STYLE_ID } from "~/src/core/utils/get-ui";
import {
  LETTER_STYLE_ATTRIBUTE,
  MARKER_STYLE_ATTRIBUTE,
  MARKER_VARIANT_STYLE_ATTRIBUTE,
  WATCH_LARGE_ICON_SIZE_PX,
  WATCH_SMALL_ICON_SIZE_PX,
  type WatchActionTileOptions
} from "~/src/core/actions/watch-mode/shared";
import { getDocumentStyleRoot, upsertStyle } from "~/src/core/utils/inject-styles";

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

const renderWatchOverlayStyles = (): string => {
  return `#${WATCH_HINTS_ID}{position:fixed;left:0;top:0;transform:translate(-50%,-50%);display:none;pointer-events:none;z-index:2147483646;color:#f5f5f5;text-transform:lowercase;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:12px;font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,.5)}#${WATCH_HINTS_ID}[data-visible="true"]{display:block}#${WATCH_HINTS_ID} [data-watch-grid="true"]{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-template-areas:"fullscreen fullscreen fullscreen pause pause pause" "mute mute captions captions loop loop";column-gap:12px;row-gap:12px;width:188px;max-width:100%;align-items:stretch}#${WATCH_HINTS_ID} [${MARKER_STYLE_ATTRIBUTE}="true"][${MARKER_VARIANT_STYLE_ATTRIBUTE}="watch-action"]{display:inline-flex;align-items:center;justify-content:center;position:static;left:auto;top:auto;transform:none;text-shadow:none;letter-spacing:0;line-height:1;box-sizing:border-box;min-width:0;overflow:hidden}#${WATCH_HINTS_ID} [data-watch-tile="true"]{gap:.45em;width:100%;padding:10px}#${WATCH_HINTS_ID} [data-watch-tile="true"][data-watch-compact="false"]{flex-direction:column;aspect-ratio:1/1;border-radius:12px}#${WATCH_HINTS_ID} [data-watch-tile="true"][data-watch-compact="true"]{flex-direction:row;height:48px;border-radius:8px}#${WATCH_HINTS_ID} [data-watch-area="fullscreen"]{grid-area:fullscreen}#${WATCH_HINTS_ID} [data-watch-area="pause"]{grid-area:pause}#${WATCH_HINTS_ID} [data-watch-area="mute"]{grid-area:mute}#${WATCH_HINTS_ID} [data-watch-area="captions"]{grid-area:captions}#${WATCH_HINTS_ID} [data-watch-area="loop"]{grid-area:loop}#${WATCH_HINTS_ID} [data-watch-icon="true"]{flex:0 0 auto;color:#000;opacity:.95}#${WATCH_HINTS_ID} [data-watch-label="true"]{display:inline-flex;align-items:center;justify-content:center;gap:.08em;font-size:15px;font-weight:800;line-height:1;text-shadow:none}#${WATCH_HINTS_ID} [${LETTER_STYLE_ATTRIBUTE}="typed"]{color:inherit}`;
};

const getWatchHintsOverlay = (): HTMLDivElement => {
  const existingOverlay = document.getElementById(WATCH_HINTS_ID);
  if (existingOverlay instanceof HTMLDivElement) {
    return existingOverlay;
  }

  upsertStyle(getDocumentStyleRoot(), WATCH_STYLE_ID, renderWatchOverlayStyles());

  const overlay = document.createElement("div");
  overlay.id = WATCH_HINTS_ID;
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("data-visible", "false");
  ensureOverlayRoot().append(overlay);
  return overlay;
};

const createWatchIcon = (path: string, sizePx: number): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(sizePx));
  svg.setAttribute("height", String(sizePx));
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("data-watch-icon", "true");

  const node = document.createElementNS("http://www.w3.org/2000/svg", "path");
  node.setAttribute("d", path);
  svg.append(node);

  return svg;
};

const createWatchActionGrid = (): HTMLDivElement => {
  const grid = document.createElement("div");
  grid.setAttribute("data-watch-grid", "true");
  return grid;
};

export const createWatchOverlayController = ({
  getActionSequence,
  getShowCapitalizedLetters,
  getVideoMutedState
}: WatchOverlayControllerDeps) => {
  let watchOverlayRenderKey = "";

  const createWatchLabel = (sequence: string): HTMLSpanElement => {
    const label = document.createElement("span");
    label.setAttribute("data-watch-label", "true");

    const display = getShowCapitalizedLetters() ? sequence.toUpperCase() : sequence.toLowerCase();

    for (const char of Array.from(display)) {
      const letter = document.createElement("span");
      letter.textContent = char;
      letter.setAttribute(LETTER_STYLE_ATTRIBUTE, "pending");
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
    tile.setAttribute(MARKER_STYLE_ATTRIBUTE, "true");
    tile.setAttribute(MARKER_VARIANT_STYLE_ATTRIBUTE, "watch-action");
    tile.setAttribute("data-watch-tile", "true");
    tile.setAttribute("data-watch-compact", compact ? "true" : "false");
    tile.append(
      createWatchIcon(iconPath, compact ? WATCH_SMALL_ICON_SIZE_PX : WATCH_LARGE_ICON_SIZE_PX),
      createWatchLabel(sequence)
    );
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
    fullscreenTile.setAttribute("data-watch-area", "fullscreen");

    const pauseTile = createWatchActionTile({
      iconPath: playPauseIconPath,
      sequence: pauseSequence
    });
    pauseTile.setAttribute("data-watch-area", "pause");

    const muteTile = createWatchActionTile({
      iconPath: muteIconPath,
      sequence: muteSequence,
      compact: true
    });
    muteTile.setAttribute("data-watch-area", "mute");

    const captionsTile = createWatchActionTile({
      iconPath: WATCH_CAPTIONS_ICON_PATH,
      sequence: captionsSequence,
      compact: true
    });
    captionsTile.setAttribute("data-watch-area", "captions");

    const loopTile = createWatchActionTile({
      iconPath: WATCH_LOOP_ICON_PATH,
      sequence: loopSequence,
      compact: true
    });
    loopTile.setAttribute("data-watch-area", "loop");

    grid.append(fullscreenTile, pauseTile, muteTile, captionsTile, loopTile);
    overlay.append(grid);
  };

  return {
    hideOverlay: (): void => {
      const overlay = document.getElementById(WATCH_HINTS_ID);
      if (overlay instanceof HTMLDivElement) {
        overlay.setAttribute("data-visible", "false");
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
      overlay.setAttribute("data-visible", "true");
    }
  };
};