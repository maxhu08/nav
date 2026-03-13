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
import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";

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
type SiteToggleControlKind = "fullscreen" | "mute" | "captions" | "loop";

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
  return styles.display !== "none" && styles.visibility !== "hidden" && styles.opacity !== "0";
};

const getVideoElementsFromRoot = (root: ParentNode): HTMLVideoElement[] => {
  const videos = new Set<HTMLVideoElement>();
  const visitedRoots = new Set<ParentNode>();

  const visitRoot = (currentRoot: ParentNode): void => {
    if (visitedRoots.has(currentRoot)) {
      return;
    }
    visitedRoots.add(currentRoot);

    const walker = document.createTreeWalker(currentRoot, NodeFilter.SHOW_ELEMENT);
    let node: Node | null = walker.nextNode();

    while (node) {
      if (node instanceof HTMLVideoElement) {
        videos.add(node);
      }

      if (node instanceof HTMLElement && node.shadowRoot) {
        visitRoot(node.shadowRoot);
      }

      node = walker.nextNode();
    }
  };

  visitRoot(root);

  return Array.from(videos);
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
  let watchOverlayRenderKey = "";

  const CONTROL_TEXT_ATTRIBUTES = [
    "aria-label",
    "title",
    "name",
    "id",
    "class",
    "data-testid",
    "data-test-id",
    "data-icon",
    "data-title-no-tooltip",
    "data-tooltip-target-id"
  ] as const;

  const isInteractiveControl = (element: HTMLElement): boolean => {
    if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
      return false;
    }

    if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return !element.disabled;
    }

    if (element.tagName.toLowerCase() === "summary") {
      return true;
    }

    if (element instanceof HTMLInputElement) {
      return !element.disabled && element.type.toLowerCase() !== "hidden";
    }

    if (element instanceof HTMLAnchorElement) {
      return !!element.href;
    }

    const role = element.getAttribute("role")?.toLowerCase();
    if (
      role &&
      ["button", "switch", "checkbox", "radio", "menuitem", "menuitemcheckbox"].includes(role)
    ) {
      return true;
    }

    if (element.hasAttribute("onclick") || element.hasAttribute("jsaction")) {
      return true;
    }

    const tabIndexValue = element.getAttribute("tabindex");
    if (tabIndexValue !== null) {
      const parsedTabIndex = Number.parseInt(tabIndexValue, 10);
      if (!Number.isNaN(parsedTabIndex) && parsedTabIndex >= 0) {
        return true;
      }
    }

    return false;
  };

  const getInteractiveControlTarget = (
    element: HTMLElement,
    root: HTMLElement
  ): HTMLElement | null => {
    let current: HTMLElement | null = element;
    while (current && current !== root) {
      if (isInteractiveControl(current)) {
        return current;
      }
      current = current.parentElement;
    }

    if (current === root && isInteractiveControl(current)) {
      return current;
    }

    return null;
  };

  const isElementVisible = (element: HTMLElement): boolean => {
    const bounds = element.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) {
      return false;
    }

    const styles = window.getComputedStyle(element);
    if (styles.display === "none" || styles.visibility === "hidden" || styles.opacity === "0") {
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

    return true;
  };

  const getControlText = (element: HTMLElement): string => {
    return [
      ...CONTROL_TEXT_ATTRIBUTES.map((attributeName) => element.getAttribute(attributeName)),
      element.textContent
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  };

  const isLikelyFullscreenControl = (element: HTMLElement): boolean => {
    const className = typeof element.className === "string" ? element.className : "";
    const label = getControlLabelText(element);

    return (
      className.toLowerCase().includes("fullscreen") ||
      label.includes("fullscreen") ||
      label.includes("full screen") ||
      label.includes("exit fullscreen") ||
      label.includes("exit full screen")
    );
  };

  const getControlLabelText = (element: HTMLElement): string => {
    return getControlText(element);
  };

  const isLikelyMuteControl = (element: HTMLElement): boolean => {
    const className = typeof element.className === "string" ? element.className : "";
    const label = getControlLabelText(element);
    return (
      className.toLowerCase().includes("mute") ||
      className.toLowerCase().includes("volume") ||
      label.includes("mute") ||
      label.includes("unmute") ||
      label.includes("volume")
    );
  };

  const isLikelyCaptionsControl = (element: HTMLElement): boolean => {
    const className = typeof element.className === "string" ? element.className : "";
    const label = getControlLabelText(element);
    return (
      className.toLowerCase().includes("caption") ||
      className.toLowerCase().includes("subtitle") ||
      label.includes("caption") ||
      label.includes("subtitles") ||
      label.includes("subtitle") ||
      label.includes("cc")
    );
  };

  const isLikelyLoopControl = (element: HTMLElement): boolean => {
    const className = typeof element.className === "string" ? element.className : "";
    const label = getControlLabelText(element);
    return (
      className.toLowerCase().includes("loop") ||
      className.toLowerCase().includes("repeat") ||
      label.includes("loop") ||
      label.includes("repeat")
    );
  };

  const findYouTubeToggleControl = (
    video: HTMLVideoElement,
    kind: SiteToggleControlKind
  ): HTMLElement | null => {
    const playerRoot = video.closest(".html5-video-player");
    if (!(playerRoot instanceof HTMLElement)) {
      return null;
    }

    const selectorByKind: Partial<Record<SiteToggleControlKind, string>> = {
      fullscreen: ".ytp-fullscreen-button",
      mute: ".ytp-mute-button",
      captions: ".ytp-subtitles-button"
    };
    const selector = selectorByKind[kind];
    if (!selector) {
      return null;
    }

    const control = playerRoot.querySelector(selector);
    if (!(control instanceof HTMLElement) || !isInteractiveControl(control)) {
      return null;
    }

    return control;
  };

  const findSiteToggleControl = (
    video: HTMLVideoElement,
    kind: SiteToggleControlKind
  ): HTMLElement | null => {
    const youtubeControl = findYouTubeToggleControl(video, kind);
    if (youtubeControl) {
      return youtubeControl;
    }

    const containerCandidates: HTMLElement[] = [];
    const seenRoots = new Set<HTMLElement>();

    const addContainerCandidate = (candidate: HTMLElement | null): void => {
      if (!candidate || seenRoots.has(candidate)) {
        return;
      }
      seenRoots.add(candidate);
      containerCandidates.push(candidate);
    };

    addContainerCandidate(video.closest(".html5-video-player"));
    addContainerCandidate(video.closest("[class*='player' i]"));
    addContainerCandidate(video.closest("[id*='player' i]"));
    addContainerCandidate(video.parentElement);

    let ancestor: HTMLElement | null = video.parentElement;
    for (let depth = 0; depth < 6 && ancestor; depth += 1) {
      addContainerCandidate(ancestor);
      ancestor = ancestor.parentElement;
    }

    addContainerCandidate(document.body);

    const controlSelectorsByKind: Record<SiteToggleControlKind, string> = {
      fullscreen: [
        ".ytp-fullscreen-button",
        "[aria-label*='fullscreen' i]",
        "[title*='fullscreen' i]",
        "[class*='fullscreen' i]",
        "[data-testid*='fullscreen' i]"
      ].join(", "),
      mute: [
        ".ytp-mute-button",
        "[aria-label*='mute' i]",
        "[aria-label*='unmute' i]",
        "[title*='unmute' i]",
        "[title*='mute' i]",
        "[aria-label*='volume' i]",
        "[title*='volume' i]",
        "[name*='volume' i]",
        "[name*='mute' i]",
        "[class*='mute' i]",
        "[class*='volume' i]",
        "[id*='mute' i]",
        "[id*='volume' i]",
        "[data-testid*='mute' i]",
        "[data-testid*='volume' i]"
      ].join(", "),
      captions: [
        ".ytp-subtitles-button",
        "[aria-label*='caption' i]",
        "[aria-label*='subtitle' i]",
        "[title*='caption' i]",
        "[title*='subtitle' i]",
        "[class*='caption' i]",
        "[class*='subtitle' i]",
        "[data-testid*='caption' i]",
        "[data-testid*='subtitle' i]"
      ].join(", "),
      loop: [
        "[aria-label*='loop' i]",
        "[aria-label*='repeat' i]",
        "[title*='loop' i]",
        "[title*='repeat' i]",
        "[class*='loop' i]",
        "[class*='repeat' i]",
        "[data-testid*='loop' i]",
        "[data-testid*='repeat' i]"
      ].join(", ")
    };
    const selectors = controlSelectorsByKind[kind];
    const videoBounds = video.getBoundingClientRect();
    const candidateScores = new Map<HTMLElement, number>();

    const getDistanceScore = (control: HTMLElement): number => {
      const bounds = control.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const leftCornerDistance = Math.hypot(
        centerX - videoBounds.left,
        centerY - videoBounds.bottom
      );
      const rightCornerDistance = Math.hypot(
        centerX - videoBounds.right,
        centerY - videoBounds.bottom
      );
      const minDistance = Math.min(leftCornerDistance, rightCornerDistance);
      return Math.max(0, 8 - minDistance / 90);
    };

    for (const root of containerCandidates) {
      const controls = Array.from(root.querySelectorAll(selectors)).filter(
        (element): element is HTMLElement => element instanceof HTMLElement
      );

      for (const control of controls) {
        const candidate = getInteractiveControlTarget(control, root);
        if (!candidate || candidate.closest(`#${WATCH_HINTS_ID}`)) {
          continue;
        }

        if (!isElementVisible(candidate)) {
          continue;
        }

        if (
          kind === "mute" &&
          (candidate.getAttribute("role")?.toLowerCase() === "slider" ||
            (candidate instanceof HTMLInputElement && candidate.type.toLowerCase() === "range"))
        ) {
          continue;
        }

        const isLikelyControl =
          kind === "fullscreen"
            ? isLikelyFullscreenControl(candidate)
            : kind === "mute"
              ? isLikelyMuteControl(candidate)
              : kind === "captions"
                ? isLikelyCaptionsControl(candidate)
                : isLikelyLoopControl(candidate);
        if (!isLikelyControl) {
          continue;
        }

        const controlText = getControlText(candidate);
        let score = getDistanceScore(candidate);

        if (kind === "mute") {
          if (/\b(mute|unmute|volume|sound|speaker|audio)\b/.test(controlText)) {
            score += 18;
          }
          if (/\b(slider|seek|scrub|timeline|progress|bar|knob)\b/.test(controlText)) {
            score -= 20;
          }
        }

        if (kind === "fullscreen" && /\b(fullscreen|full screen)\b/.test(controlText)) {
          score += 16;
        }
        if (
          kind === "captions" &&
          /\b(cc|caption|captions|subtitle|subtitles)\b/.test(controlText)
        ) {
          score += 16;
        }
        if (kind === "loop" && /\b(loop|repeat)\b/.test(controlText)) {
          score += 16;
        }

        if (candidate.hasAttribute("aria-pressed") || candidate.hasAttribute("aria-checked")) {
          score += 3;
        }

        const currentBestScore = candidateScores.get(candidate) ?? Number.NEGATIVE_INFINITY;
        if (score > currentBestScore) {
          candidateScores.set(candidate, score);
        }
      }
    }

    let bestControl: HTMLElement | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const [control, score] of candidateScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestControl = control;
      }
    }

    return bestControl;
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

    const visibleVideos = getVideoElementsFromRoot(document).filter(
      (video): video is HTMLVideoElement =>
        video instanceof HTMLVideoElement && isVideoVisible(video)
    );

    if (visibleVideos.length === 0) {
      return null;
    }

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const getVideoScore = (video: HTMLVideoElement): number => {
      const bounds = video.getBoundingClientRect();
      const areaScore = bounds.width * bounds.height;
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const centerDistance = Math.hypot(centerX - viewportCenterX, centerY - viewportCenterY);
      const centerScore = Math.max(0, 20000 - centerDistance * 60);
      const playingScore = !video.paused && !video.ended ? 1_000_000_000 : 0;
      return playingScore + areaScore + centerScore;
    };

    const rankedVideos = [...visibleVideos].sort((left, right) => {
      return getVideoScore(right) - getVideoScore(left);
    });

    return rankedVideos[0] ?? null;
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

  const showWatchToggleToast = (message: string): void => {
    ensureToastWrapper();
    const toast = getToastApi();
    toast?.info(message);
  };

  const getControlPressedState = (control: HTMLElement): boolean | null => {
    const ariaPressed = control.getAttribute("aria-pressed");
    if (ariaPressed === "true") {
      return true;
    }
    if (ariaPressed === "false") {
      return false;
    }

    const ariaChecked = control.getAttribute("aria-checked");
    if (ariaChecked === "true") {
      return true;
    }
    if (ariaChecked === "false") {
      return false;
    }

    return null;
  };

  const getCaptionsState = (video: HTMLVideoElement, control: HTMLElement | null): boolean => {
    if (control) {
      if (control.classList.contains("ytp-subtitles-button")) {
        return control.classList.contains("ytp-subtitles-button-enabled");
      }

      const pressedState = getControlPressedState(control);
      if (pressedState !== null) {
        return pressedState;
      }
    }

    return getToggleableTextTracks(video).some((track) => track.mode === "showing");
  };

  const getVideoMutedState = (video: HTMLVideoElement): boolean => {
    return video.muted || video.volume <= 0;
  };

  const getMuteStateFromControl = (
    video: HTMLVideoElement,
    control: HTMLElement | null
  ): boolean => {
    if (!control) {
      return getVideoMutedState(video);
    }

    if (control.classList.contains("ytp-mute-button")) {
      return control.classList.contains("ytp-mute-button-active");
    }

    const pressedState = getControlPressedState(control);
    if (pressedState !== null) {
      return pressedState;
    }

    const text = getControlText(control);
    if (/\bunmute\b/.test(text)) {
      return true;
    }
    if (/\bmute\b/.test(text)) {
      return false;
    }

    return getVideoMutedState(video);
  };

  const triggerMuteControlWithKeyboard = (control: HTMLElement): void => {
    control.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    control.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
  };

  const toggleMuteWithFallback = (video: HTMLVideoElement): boolean => {
    const siteMuteControl = findSiteToggleControl(video, "mute");
    const wasMuted = getMuteStateFromControl(video, siteMuteControl);

    if (siteMuteControl) {
      siteMuteControl.click();
      let muteStateAfterTrigger = getMuteStateFromControl(video, siteMuteControl);
      if (muteStateAfterTrigger !== wasMuted) {
        return muteStateAfterTrigger;
      }

      triggerMuteControlWithKeyboard(siteMuteControl);
      muteStateAfterTrigger = getMuteStateFromControl(video, siteMuteControl);
      if (muteStateAfterTrigger !== wasMuted) {
        return muteStateAfterTrigger;
      }
    }

    video.muted = !wasMuted;
    if (video.muted === wasMuted) {
      video.muted = !video.muted;
    }

    return getVideoMutedState(video);
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

  const showWatchHintsOverlay = (video: HTMLVideoElement): void => {
    const overlay = getWatchHintsOverlay();
    const fullscreenSequence = deps.getActionSequence("toggle-fullscreen", "f");
    const pauseSequence = deps.getActionSequence("toggle-play-pause", "e");
    const loopSequence = deps.getActionSequence("toggle-loop", "l");
    const muteSequence = deps.getActionSequence("toggle-mute", "m");
    const captionsSequence = deps.getActionSequence("toggle-captions", "c");
    const overlayRenderKey = [
      fullscreenSequence,
      pauseSequence,
      loopSequence,
      muteSequence,
      captionsSequence,
      watchShowCapitalizedLetters ? "caps" : "lower",
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
      watchOverlayRenderKey = "";
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
      const wasLooping = video.loop;
      const siteLoopControl = findSiteToggleControl(video, "loop");
      if (siteLoopControl) {
        siteLoopControl.click();
      } else {
        video.loop = !video.loop;
      }
      const isLooping = siteLoopControl
        ? video.loop === wasLooping
          ? !wasLooping
          : video.loop
        : video.loop;
      showWatchToggleToast(isLooping ? "Loop on" : "Loop off");
      exitWatchMode();
      return true;
    },
    toggleWatchMute: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const isMuted = toggleMuteWithFallback(video);
      showWatchToggleToast(isMuted ? "Video muted" : "Video unmuted");
      exitWatchMode();
      return true;
    },
    toggleWatchCaptions: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const siteCaptionsControl = findSiteToggleControl(video, "captions");
      const hadTracks = getToggleableTextTracks(video).length > 0;
      const wasCaptionsOn = getCaptionsState(video, siteCaptionsControl);
      if (siteCaptionsControl) {
        siteCaptionsControl.click();
      } else if (!toggleWatchVideoTextTracks(video)) {
        showWatchToggleToast("Captions unavailable");
        exitWatchMode();
        return true;
      }

      let captionsOn = getCaptionsState(video, siteCaptionsControl);
      if (captionsOn === wasCaptionsOn) {
        if (!siteCaptionsControl && hadTracks && toggleWatchVideoTextTracks(video)) {
          captionsOn = getToggleableTextTracks(video).some((track) => track.mode === "showing");
        } else {
          captionsOn = !wasCaptionsOn;
        }
      }

      showWatchToggleToast(captionsOn ? "Captions on" : "Captions off");
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

      const siteFullscreenControl = findSiteToggleControl(video, "fullscreen");
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
      const wasLooping = video.loop;
      const siteLoopControl = findSiteToggleControl(video, "loop");
      if (siteLoopControl) {
        siteLoopControl.click();
      } else {
        video.loop = !video.loop;
      }
      if (!siteLoopControl && video.loop === wasLooping) {
        video.loop = !video.loop;
      }
      return true;
    },
    toggleMute: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      toggleMuteWithFallback(video);
      return true;
    },
    toggleCaptions: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const siteCaptionsControl = findSiteToggleControl(video, "captions");
      const hadTracks = getToggleableTextTracks(video).length > 0;
      if (siteCaptionsControl) {
        siteCaptionsControl.click();
        return true;
      }

      if (!hadTracks) {
        return false;
      }

      return toggleWatchVideoTextTracks(video);
    }
  };
};