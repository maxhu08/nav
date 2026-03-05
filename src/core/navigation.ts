import {
  activateHints,
  areHintsActive,
  areHintsPendingSelection,
  exitHints,
  handleHintsKeydown,
  setReservedHintPrefixes
} from "~/src/core/actions/hints";
import {
  installScrollTracking,
  scrollHalfPageDown,
  scrollHalfPageUp,
  scrollLeft,
  scrollRight,
  scrollDown,
  scrollToBottom,
  scrollToTop,
  scrollUp
} from "~/src/core/actions/scroll";
import { goHistory, createTabCommandAction } from "~/src/core/actions/tabs";
import { yankCurrentTabUrl, yankImage, yankImageUrl, yankLinkUrl } from "~/src/core/actions/yank";
import { createStorageChangeHandler, syncFastConfig } from "~/src/core/utils/fast-config-sync";
import { ensureFocusStyles, syncFocusStyles } from "~/src/core/utils/focus-styles";
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/isEditableTarget";
import { ensureToastWrapper } from "~/src/core/utils/sonner";
import { getExtensionNamespace } from "~/src/utils/extension-id";
import { type FastConfig, type FastRule } from "~/src/utils/fast-config";
import { type ActionName } from "~/src/utils/hotkeys";
import { DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR } from "~/src/utils/config";

type ActionHandler = (count?: number) => boolean;
type FindMatch = {
  range: Range;
  element: HTMLElement;
};

let keyActions: Partial<Record<string, ActionName>> = {};
let keyActionPrefixes: Partial<Record<string, true>> = {};
let urlRulesMode: FastConfig["rules"]["urls"]["mode"] = "blacklist";
let urlBlacklistRules: FastRule[] = [];
let urlWhitelistRules: FastRule[] = [];
let watchVideoElement: HTMLVideoElement | null = null;
let watchModeActive = false;
let watchShowCapitalizedLetters = false;
let watchHighlightThumbnails = true;

const getCssHighlights = (): {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
} | null => {
  const cssObject = globalThis.CSS as unknown as {
    highlights?: {
      set: (name: string, highlight: unknown) => void;
      delete: (name: string) => void;
    };
  };

  return cssObject.highlights ?? null;
};

const clearFindHighlights = (): void => {
  const highlights = getCssHighlights();
  highlights?.delete(FIND_HIGHLIGHT_NAME);
  highlights?.delete(FIND_CURRENT_HIGHLIGHT_NAME);
};

const getFindBar = (): HTMLDivElement | null =>
  getFindUiRoot()?.getElementById(FIND_BAR_ID) as HTMLDivElement | null;

const getFindInput = (): HTMLInputElement | null =>
  getFindUiRoot()?.getElementById(FIND_INPUT_ID) as HTMLInputElement | null;

const getFindMatchCount = (): HTMLSpanElement | null =>
  getFindUiRoot()?.getElementById(FIND_MATCH_COUNT_ID) as HTMLSpanElement | null;

const getFindBarActions = (): HTMLDivElement | null =>
  getFindUiRoot()?.querySelector(".nav-find-bar-actions") as HTMLDivElement | null;

const getFindStatus = (): HTMLDivElement | null =>
  getFindUiRoot()?.getElementById(FIND_STATUS_ID) as HTMLDivElement | null;

const getFindStatusText = (): HTMLSpanElement | null =>
  getFindUiRoot()?.getElementById(FIND_STATUS_TEXT_ID) as HTMLSpanElement | null;

const getFindPrevButton = (): HTMLButtonElement | null =>
  getFindUiRoot()?.getElementById(FIND_PREV_BUTTON_ID) as HTMLButtonElement | null;

const getFindNextButton = (): HTMLButtonElement | null =>
  getFindUiRoot()?.getElementById(FIND_NEXT_BUTTON_ID) as HTMLButtonElement | null;

const getFindClearButton = (): HTMLButtonElement | null =>
  getFindUiRoot()?.getElementById(FIND_CLEAR_BUTTON_ID) as HTMLButtonElement | null;

const getFindCountLabel = (count: number): string => `${count} Matches`;

const renderFindStatusLabel = (container: HTMLElement, index: number, count: number): void => {
  container.replaceChildren();

  const current = document.createElement("span");
  current.className = "nav-find-status-number";
  current.textContent = `${count > 0 ? index + 1 : 0}`;

  const separator = document.createElement("span");
  separator.className = "nav-find-status-separator";
  separator.textContent = " / ";

  const total = document.createElement("span");
  total.className = "nav-find-status-number";
  total.textContent = `${count}`;

  container.append(current, separator, total);
};

const updateFindUiCounts = (): void => {
  getFindMatchCount()!.textContent = getFindCountLabel(findMatches.length);
  renderFindStatusLabel(getFindStatusText()!, currentFindMatchIndex, findMatches.length);

  const hasMatches = findMatches.length > 0;
  const hasQuery = findQuery.length > 0;
  getFindBarActions()!.setAttribute("data-visible", hasQuery ? "true" : "false");
  getFindPrevButton()!.disabled = !hasMatches;
  getFindNextButton()!.disabled = !hasMatches;
  getFindClearButton()!.disabled = !hasQuery;
};

const applyFindHighlights = (): void => {
  clearFindHighlights();

  if (findMatches.length === 0 || typeof Highlight === "undefined") {
    return;
  }

  const highlights = getCssHighlights();
  if (!highlights) {
    return;
  }

  highlights.set(
    FIND_HIGHLIGHT_NAME,
    new Highlight(...findMatches.map((match) => match.range.cloneRange()))
  );

  const currentMatch = findMatches[currentFindMatchIndex];
  if (currentMatch) {
    highlights.set(FIND_CURRENT_HIGHLIGHT_NAME, new Highlight(currentMatch.range.cloneRange()));
  }
};

const isFindableTextContainer = (element: HTMLElement | null): element is HTMLElement => {
  if (!element) {
    return false;
  }

  if (
    element.closest(`#${FIND_BAR_ID}`) ||
    element.closest(`#${FIND_STATUS_ID}`) ||
    element.closest("[data-sonner-toaster]") ||
    element.closest("script, style, noscript, textarea, select, option")
  ) {
    return false;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
    return false;
  }

  if (
    isEditableTarget(element) ||
    element.closest("[contenteditable='true'], [contenteditable='']")
  ) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.visibility !== "collapse" &&
    Number.parseFloat(style.opacity) !== 0
  );
};

const collectFindMatches = (query: string): FindMatch[] => {
  const normalizedQuery = query.toLowerCase();
  if (!normalizedQuery || !document.body) {
    return [];
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const matches: FindMatch[] = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode instanceof Text) {
      const parentElement = currentNode.parentElement;

      if (isFindableTextContainer(parentElement)) {
        const text = currentNode.textContent ?? "";
        const normalizedText = text.toLowerCase();
        let searchIndex = 0;

        while (searchIndex < normalizedText.length) {
          const matchIndex = normalizedText.indexOf(normalizedQuery, searchIndex);
          if (matchIndex === -1) {
            break;
          }

          const range = document.createRange();
          range.setStart(currentNode, matchIndex);
          range.setEnd(currentNode, matchIndex + normalizedQuery.length);

          if (range.getClientRects().length > 0) {
            matches.push({
              range,
              element: parentElement
            });
          }

          searchIndex = matchIndex + normalizedQuery.length;
        }
      }
    }

    currentNode = walker.nextNode();
  }

  return matches;
};

const focusCurrentFindMatch = (): void => {
  const currentMatch = findMatches[currentFindMatchIndex];

  if (!currentMatch) {
    updateFindUiCounts();
    applyFindHighlights();
    return;
  }

  currentMatch.element.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "auto"
  });

  if (showActivationIndicator) {
    window.dispatchEvent(
      new CustomEvent(FOCUS_INDICATOR_EVENT, {
        detail: {
          element: currentMatch.element
        }
      })
    );
  }

  updateFindUiCounts();
  applyFindHighlights();
};

const setFindQuery = (query: string): void => {
  findQuery = query;
  findMatches = collectFindMatches(query);
  currentFindMatchIndex = findMatches.length > 0 ? 0 : -1;
  updateFindUiCounts();
  applyFindHighlights();
};

const hideFindBar = (): void => {
  getFindBar()?.setAttribute("data-visible", "false");
};

const isFindModeActive = (): boolean =>
  getFindBar()?.getAttribute("data-visible") === "true" || isFindStatusVisible;

const isFindInputFocused = (): boolean => {
  const root = getFindUiRoot();
  const input = getFindInput();

  if (!root || !input) {
    return false;
  }

  return getDeepActiveElement(root) === input || getDeepActiveElement() === input;
};

const clearFindInput = (): void => {
  const input = getFindInput();
  if (!input) {
    return;
  }

  input.value = "";
  setFindQuery("");
  input.focus();
};

const syncFindStatusVisibility = (): void => {
  getFindStatus()?.setAttribute("data-visible", isFindStatusVisible ? "true" : "false");
};

const clearFindSession = (): void => {
  findQuery = "";
  findMatches = [];
  currentFindMatchIndex = -1;
  isFindStatusVisible = false;
  clearFindHighlights();
  updateFindUiCounts();
  syncFindStatusVisibility();
  hideFindBar();
};

const exitFindMode = (): void => {
  clearFindSession();

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

const commitFindQuery = (): boolean => {
  const query = getFindInput()?.value ?? "";
  setFindQuery(query);
  hideFindBar();

  if (query.length === 0) {
    isFindStatusVisible = false;
    syncFindStatusVisibility();
    clearFindHighlights();
    return false;
  }

  isFindStatusVisible = true;
  syncFindStatusVisibility();
  focusCurrentFindMatch();
  return true;
};

const cycleFindMatch = (direction: 1 | -1): boolean => {
  if (findQuery.length === 0 || findMatches.length === 0) {
    return false;
  }

  currentFindMatchIndex =
    (currentFindMatchIndex + direction + findMatches.length) % findMatches.length;
  focusCurrentFindMatch();
  return true;
};

const openFindMode = (): boolean => {
  const bar = getFindBar();
  const input = getFindInput();

  if (!bar || !input) {
    return false;
  }

  input.value = findQuery;
  setFindQuery(input.value);
  bar.setAttribute("data-visible", "true");
  input.focus();
  input.select();
  return true;
};

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

const getWatchActionSequence = (actionName: WatchActionName, fallback: string): string => {
  const sequences = Object.entries(keyActions)
    .filter((entry): entry is [string, ActionName] => !!entry[1])
    .filter(([, candidateAction]) => candidateAction === actionName)
    .map(([sequence]) => sequence)
    .sort((left, right) => left.length - right.length);

  return sequences[0] ?? fallback;
};

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
  marker.setAttribute(
    MARKER_VARIANT_STYLE_ATTRIBUTE,
    watchHighlightThumbnails ? "thumbnail" : "default"
  );
  marker.style.display = "inline-flex";
  marker.style.alignItems = "center";
  marker.style.gap = "0.35em";
  marker.style.position = "static";
  marker.style.left = "auto";
  marker.style.top = "auto";
  marker.style.transform = "none";

  const display = watchShowCapitalizedLetters ? key.toUpperCase() : key.toLowerCase();

  for (const char of Array.from(display)) {
    const letter = document.createElement("span");
    letter.textContent = char;
    letter.setAttribute(LETTER_STYLE_ATTRIBUTE, "pending");
    marker.append(letter);
  }

  for (const icon of icons) {
    marker.append(icon);
  }

  return marker;
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

const renderWatchHintsOverlay = (video: HTMLVideoElement): void => {
  const overlay = getWatchHintsOverlay();
  overlay.replaceChildren();
  const fullscreenSequence = getWatchActionSequence("toggle-fullscreen", "f");
  const pauseSequence = getWatchActionSequence("toggle-play-pause", "k");
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

const hideWatchHintsOverlay = (): void => {
  const overlay = document.getElementById(WATCH_HINTS_ID);
  if (!(overlay instanceof HTMLDivElement)) {
    return;
  }

  overlay.style.display = "none";
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
    hideWatchHintsOverlay();
    return;
  }

  showWatchHintsOverlay(video);
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
    (video): video is HTMLVideoElement => video instanceof HTMLVideoElement && isVideoVisible(video)
  );

  if (visibleVideos.length === 0) {
    return null;
  }

  const playingVideo = visibleVideos.find((video) => !video.paused && !video.ended);
  return playingVideo ?? visibleVideos[0] ?? null;
};

const getActiveWatchVideo = (): HTMLVideoElement | null => {
  if (!watchModeActive) {
    return null;
  }

  const trackedVideo = getTrackedWatchVideo();

  if (trackedVideo) {
    return trackedVideo;
  }

  exitWatchMode();
  return null;
};

const isWatchModeActive = (): boolean => getActiveWatchVideo() !== null;

const exitWatchMode = (): void => {
  watchModeActive = false;
  hideWatchHintsOverlay();
};

const toggleVideoControls = (): boolean => {
  if (watchModeActive) {
    exitWatchMode();
    return true;
  }

  const targetVideo = getBestWatchVideo();
  if (!targetVideo) {
    return false;
  }

  watchVideoElement = targetVideo;
  watchModeActive = true;
  targetVideo.focus({ preventScroll: true });
  syncWatchHintsOverlay();
  return true;
};

const toggleWatchPlayPause = (): boolean => {
  const video = getActiveWatchVideo();
  if (!video) {
    return false;
  }

  if (video.paused || video.ended) {
    void video.play().catch(() => {});
  } else {
    video.pause();
  }

  exitWatchMode();
  return true;
};

const togglePlayPause = (): boolean => {
  const video = getActiveWatchVideo();
  if (!video) {
    return false;
  }

  if (video.paused || video.ended) {
    void video.play().catch(() => {});
    return true;
  }

  video.pause();
  return true;
};

const toggleFullscreen = (): boolean => {
  const video = getActiveWatchVideo();
  if (!video) {
    return false;
  }

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
};

const isOptionsPage = (): boolean => {
  const optionsUrl = chrome.runtime.getURL("options.html");
  return window.location.href === optionsUrl;
};

const ACTIONS: Record<ActionName, ActionHandler> = {
  "toggle-video-controls": toggleVideoControls,
  "toggle-fullscreen": toggleFullscreen,
  "toggle-play-pause": togglePlayPause,
  "enable-find-mode": openFindMode,
  "cycle-match-next": () => cycleFindMatch(1),
  "cycle-match-prev": () => cycleFindMatch(-1),
  "history-go-prev": (count = 1) => goHistory(-count),
  "history-go-next": (count = 1) => goHistory(count),
  "tab-go-prev": createTabCommandAction("tab-go-prev"),
  "tab-go-next": createTabCommandAction("tab-go-next"),
  "duplicate-current-tab": createTabCommandAction("duplicate-current-tab"),
  "move-current-tab-to-new-window": createTabCommandAction("move-current-tab-to-new-window"),
  "close-current-tab": createTabCommandAction("close-current-tab"),
  "create-new-tab": createTabCommandAction("create-new-tab"),
  "reload-current-tab": createTabCommandAction("reload-current-tab"),
  "reload-current-tab-hard": createTabCommandAction("reload-current-tab-hard"),
  "toggle-hints-current-tab": () => {
    if (areHintsPendingSelection()) {
      exitHints();
      return true;
    }

    return activateHints("current-tab");
  },
  "toggle-hints-new-tab": () => {
    if (areHintsPendingSelection()) {
      exitHints();
      return true;
    }

    return activateHints("new-tab");
  },
  "yank-link-url": yankLinkUrl,
  "yank-image": yankImage,
  "yank-image-url": yankImageUrl,
  "yank-current-tab-url": yankCurrentTabUrl,
  "scroll-down": scrollDown,
  "scroll-half-page-down": scrollHalfPageDown,
  "scroll-half-page-up": scrollHalfPageUp,
  "scroll-left": scrollLeft,
  "scroll-right": scrollRight,
  "scroll-up": scrollUp,
  "scroll-to-bottom": scrollToBottom,
  "scroll-to-top": scrollToTop
};

const isScrollAction = (actionName: ActionName): boolean => {
  return (
    actionName === "scroll-down" ||
    actionName === "scroll-half-page-down" ||
    actionName === "scroll-half-page-up" ||
    actionName === "scroll-left" ||
    actionName === "scroll-right" ||
    actionName === "scroll-up" ||
    actionName === "scroll-to-bottom" ||
    actionName === "scroll-to-top"
  );
};

const KEY_SEQUENCE_TIMEOUT_MS = 1000;

let pendingSequence = "";
let pendingSequenceTimer: number | null = null;
let pendingCount = "";
let isInitialized = false;

const FOCUS_STYLE_ID = `nav-${getExtensionNamespace()}-focus-style`;
const FOCUS_OVERLAY_ID = `nav-${getExtensionNamespace()}-focus-overlay`;
const FOCUS_INDICATOR_EVENT = `nav-${getExtensionNamespace()}-focus-indicator`;
const FOCUS_OVERLAY_DURATION_MS = 1000;
const FOCUS_OVERLAY_HIDE_MS = 920;
const FOCUS_OVERLAY_FADE_OUT_MS = 220;
const FIND_HIGHLIGHT_NAME = `nav-${getExtensionNamespace()}-find-match`;
const FIND_CURRENT_HIGHLIGHT_NAME = `nav-${getExtensionNamespace()}-find-current-match`;
const FIND_OVERLAY_ID = `nav-${getExtensionNamespace()}-find-overlay`;
const FIND_STYLE_ID = `nav-${getExtensionNamespace()}-find-style`;
const FIND_BAR_ID = `nav-${getExtensionNamespace()}-find-bar`;
const FIND_INPUT_ID = `nav-${getExtensionNamespace()}-find-input`;
const FIND_MATCH_COUNT_ID = `nav-${getExtensionNamespace()}-find-match-count`;
const FIND_STATUS_ID = `nav-${getExtensionNamespace()}-find-status`;
const FIND_STATUS_TEXT_ID = `nav-${getExtensionNamespace()}-find-status-text`;
const FIND_PREV_BUTTON_ID = `nav-${getExtensionNamespace()}-find-prev`;
const FIND_NEXT_BUTTON_ID = `nav-${getExtensionNamespace()}-find-next`;
const FIND_CLEAR_BUTTON_ID = `nav-${getExtensionNamespace()}-find-clear`;
const WATCH_HINTS_ID = `nav-${getExtensionNamespace()}-watch-hints`;
const MARKER_STYLE_ATTRIBUTE = "data-nav-hint-marker";
const MARKER_VARIANT_STYLE_ATTRIBUTE = "data-nav-hint-marker-variant";
const LETTER_STYLE_ATTRIBUTE = "data-nav-hint-marker-letter";
const WATCH_FULLSCREEN_ICON_PATH =
  "M8 3V5H4V9H2V3H8ZM2 21V15H4V19H8V21H2ZM22 21H16V19H20V15H22V21ZM22 9H20V5H16V3H22V9Z";
const WATCH_PLAY_ICON_PATH =
  "M8 18.3915V5.60846L18.2264 12L8 18.3915ZM6 3.80421V20.1957C6 20.9812 6.86395 21.46 7.53 21.0437L20.6432 12.848C21.2699 12.4563 21.2699 11.5436 20.6432 11.152L7.53 2.95621C6.86395 2.53993 6 3.01878 6 3.80421Z";
const WATCH_PAUSE_ICON_PATH = "M6 3H8V21H6V3ZM16 3H18V21H16V3Z";
let focusedOverlayTarget: HTMLElement | null = null;
let focusOverlayFrame: number | null = null;
let focusOverlayTimeout: number | null = null;
let showActivationIndicator = true;
let activationIndicatorColor = DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR;
let findMatches: FindMatch[] = [];
let findQuery = "";
let currentFindMatchIndex = -1;
let isFindStatusVisible = false;

type KeyParseResult = {
  actionName: ActionName | null;
  consumed: boolean;
};

type WatchActionName = "toggle-fullscreen" | "toggle-play-pause";

const colorParsingContext = document.createElement("canvas").getContext("2d");

const rgbStringToRgba = (value: string, alpha: number): string | null => {
  const matches = value.match(/\d*\.?\d+/g);

  if (!matches || matches.length < 3) {
    return null;
  }

  const [red, green, blue, sourceAlpha] = matches.map((match) => Number.parseFloat(match));
  const resolvedAlpha = Math.max(0, Math.min(1, (sourceAlpha ?? 1) * alpha));

  return `rgba(${red}, ${green}, ${blue}, ${resolvedAlpha})`;
};

const hexToRgba = (value: string, alpha: number): string | null => {
  const normalizedHex = value.toLowerCase();
  const expandedHex =
    normalizedHex.length === 4
      ? `#${normalizedHex[1]}${normalizedHex[1]}${normalizedHex[2]}${normalizedHex[2]}${normalizedHex[3]}${normalizedHex[3]}`
      : normalizedHex;

  if (!/^#[0-9a-f]{6}$/.test(expandedHex)) {
    return null;
  }

  const red = Number.parseInt(expandedHex.slice(1, 3), 16);
  const green = Number.parseInt(expandedHex.slice(3, 5), 16);
  const blue = Number.parseInt(expandedHex.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const colorToRgba = (color: string, alpha: number): string => {
  if (!colorParsingContext) {
    return `rgba(234, 179, 8, ${alpha})`;
  }

  colorParsingContext.fillStyle = "#000000";
  colorParsingContext.fillStyle = color;

  const normalized = colorParsingContext.fillStyle.toLowerCase();

  if (normalized.startsWith("#")) {
    return hexToRgba(normalized, alpha) ?? `rgba(234, 179, 8, ${alpha})`;
  }

  if (normalized.startsWith("rgb")) {
    return rgbStringToRgba(normalized, alpha) ?? `rgba(234, 179, 8, ${alpha})`;
  }

  return `rgba(234, 179, 8, ${alpha})`;
};

const getFindOverlay = (): HTMLDivElement | null =>
  document.getElementById(FIND_OVERLAY_ID) as HTMLDivElement | null;

const getFindUiRoot = (): ShadowRoot | null => getFindOverlay()?.shadowRoot ?? null;

const renderFocusStyles = (): string => `
  @keyframes nav-focus-pulse {
    0% {
      opacity: 1;
      box-shadow:
        0 0 0 10px ${colorToRgba(activationIndicatorColor, 0.38)},
        0 0 0 6px ${colorToRgba(activationIndicatorColor, 0.95)};
    }

    18% {
      opacity: 1;
      box-shadow:
        0 0 0 5px ${colorToRgba(activationIndicatorColor, 0.18)},
        0 0 0 3px ${colorToRgba(activationIndicatorColor, 0.95)};
    }

    70% {
      opacity: 1;
      box-shadow:
        0 0 0 2px ${colorToRgba(activationIndicatorColor, 0.06)},
        0 0 0 2px ${colorToRgba(activationIndicatorColor, 0.92)};
    }

    100% {
      opacity: 0;
      box-shadow:
        0 0 0 2px ${colorToRgba(activationIndicatorColor, 0.02)},
        0 0 0 2px ${colorToRgba(activationIndicatorColor, 0)};
    }
  }

  #${FOCUS_OVERLAY_ID} {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 2147483646;
    border-radius: 0.375rem;
    box-sizing: border-box;
    opacity: 0;
    visibility: hidden;
    transform: none !important;
    transition: none !important;
    transition-duration: 0ms !important;
    transition-property: none !important;
  }

  #${FOCUS_OVERLAY_ID}[data-visible="true"] {
    visibility: visible;
    opacity: 1;
  }

  #${FOCUS_OVERLAY_ID}[data-hiding="true"] {
    visibility: visible;
    opacity: 0;
    transition: opacity ${FOCUS_OVERLAY_FADE_OUT_MS}ms ease-out !important;
  }

  #${FOCUS_OVERLAY_ID}[data-animate="true"] {
    animation: nav-focus-pulse ${FOCUS_OVERLAY_DURATION_MS}ms cubic-bezier(0.2, 0.9, 0.2, 1)
      !important;
  }
`;

const renderFindStyles = (): string => `
  #${FIND_BAR_ID} {
    all: initial;
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2147483647;
    display: none;
    pointer-events: auto;
    width: min(640px, calc(100vw - 32px));
    grid-template-columns: max-content auto max-content;
    align-items: center;
    gap: 0;
    padding: 10px 12px;
    border: 2px solid #eab308;
    border-radius: 0.5rem;
    background: #171717;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
    color: #f5f5f5;
    font-family: "JetBrains Mono", monospace;
    font-size: 24px;
    line-height: 32px;
  }

  #${FIND_BAR_ID}[data-visible="true"] {
    display: grid;
  }

  #${FIND_BAR_ID} *,
  #${FIND_STATUS_ID} * {
    box-sizing: border-box;
  }

  .nav-find-icon {
    all: unset;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5em;
    height: 1.5em;
    color: #a1a1aa;
    font-size: 24px;
    line-height: 32px;
    margin-right: 0.25rem;
  }

  .nav-find-icon svg {
    width: 1em;
    height: 1em;
    display: block;
  }

  #${FIND_INPUT_ID} {
    all: unset;
    flex: 1 1 auto;
    display: block;
    min-width: 0;
    border: 0;
    background: transparent;
    color: #fafafa;
    font-size: 24px;
    line-height: 32px;
    outline: none;
    box-shadow: none;
    appearance: none;
    -webkit-appearance: none;
    font-family: inherit;
    padding-right: 0.25rem;
  }

  #${FIND_INPUT_ID}:focus,
  #${FIND_INPUT_ID}:focus-visible {
    outline: none;
    box-shadow: none;
  }

  #${FIND_INPUT_ID}::placeholder {
    color: #a1a1aa;
  }

  #${FIND_MATCH_COUNT_ID} {
    all: unset;
    flex: 0 0 auto;
    display: inline-block;
    color: #a1a1aa;
    font-size: 24px;
    line-height: 32px;
    white-space: nowrap;
    padding-left: 0.25rem;
  }

  .nav-find-bar-actions {
    all: unset;
    display: none;
    align-items: center;
    gap: 0.5rem;
    padding-left: 0.25rem;
  }

  .nav-find-bar-actions[data-visible="true"] {
    display: inline-flex;
  }

  #${FIND_STATUS_ID} {
    all: initial;
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 2147483647;
    display: none;
    pointer-events: auto;
    grid-auto-flow: column;
    align-items: center;
    gap: 0.5rem;
    padding: 10px 12px;
    border: 2px solid #eab308;
    border-radius: 0.5rem;
    background: #171717;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
    color: #f5f5f5;
    font-family: "JetBrains Mono", monospace;
    font-size: 24px;
    line-height: 32px;
  }

  #${FIND_STATUS_ID}[data-visible="true"] {
    display: grid;
  }

  #${FIND_STATUS_TEXT_ID} {
    all: unset;
    display: inline-block;
    min-width: 52px;
    font-size: 24px;
    line-height: 32px;
    text-align: center;
    padding: 0 0.25rem;
  }

  .nav-find-status-number {
    color: #fafafa;
  }

  .nav-find-status-separator {
    color: #a1a1aa;
  }

  .nav-find-nav,
  .nav-find-clear {
    all: unset;
    position: relative;
    display: grid;
    align-items: center;
    justify-content: center;
    width: 1.5em;
    height: 1.5em;
    padding: 0;
    border: 0;
    border-radius: 0.375rem;
    background: transparent;
    color: #a1a1aa;
    cursor: pointer;
    transition:
      background-color 250ms ease,
      color 250ms ease;
    font-size: 24px;
    line-height: 32px;
    outline: none;
    box-shadow: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .nav-find-nav::before,
  .nav-find-clear::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 0.375rem;
    background: rgba(255, 255, 255, 0.12);
    opacity: 0;
    pointer-events: none;
    transition: opacity 250ms ease;
  }

  .nav-find-nav:hover:not(:disabled)::before,
  .nav-find-nav:focus-visible:not(:disabled)::before,
  .nav-find-clear:hover:not(:disabled)::before,
  .nav-find-clear:focus-visible:not(:disabled)::before {
    opacity: 1;
  }

  .nav-find-nav:disabled,
  .nav-find-clear:disabled {
    cursor: default;
    opacity: 0.35;
    color: #737373;
  }

  .nav-find-nav svg,
  .nav-find-clear svg {
    width: 1em;
    height: 1em;
    display: block;
    position: relative;
    z-index: 1;
  }

  .nav-find-nav:focus,
  .nav-find-nav:focus-visible,
  .nav-find-clear:focus,
  .nav-find-clear:focus-visible {
    outline: none;
    box-shadow: none;
  }

  ::highlight(${FIND_HIGHLIGHT_NAME}) {
    background: rgba(234, 179, 8, 0.18);
    color: inherit;
  }

  ::highlight(${FIND_CURRENT_HIGHLIGHT_NAME}) {
    background: rgba(234, 179, 8, 0.82);
    color: #111111;
  }
`;

type SvgNodeDefinition = {
  tag: "circle" | "path";
  attributes: Record<string, string>;
};

const createFindIconSvg = (nodes: SvgNodeDefinition[]): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  for (const node of nodes) {
    const child = document.createElementNS("http://www.w3.org/2000/svg", node.tag);

    for (const [name, value] of Object.entries(node.attributes)) {
      child.setAttribute(name, value);
    }

    svg.appendChild(child);
  }

  return svg;
};

const SEARCH_ICON_NODES: SvgNodeDefinition[] = [
  {
    tag: "circle",
    attributes: {
      cx: "11",
      cy: "11",
      r: "7"
    }
  },
  {
    tag: "path",
    attributes: {
      d: "M20 20l-3.5-3.5"
    }
  }
];

const ARROW_UP_ICON_NODES: SvgNodeDefinition[] = [
  {
    tag: "path",
    attributes: {
      d: "M6 15l6-6 6 6"
    }
  }
];

const ARROW_DOWN_ICON_NODES: SvgNodeDefinition[] = [
  {
    tag: "path",
    attributes: {
      d: "M6 9l6 6 6-6"
    }
  }
];

const CLOSE_ICON_NODES: SvgNodeDefinition[] = [
  {
    tag: "path",
    attributes: {
      d: "M18 6L6 18"
    }
  },
  {
    tag: "path",
    attributes: {
      d: "M6 6l12 12"
    }
  }
];

const normalizeBaseKey = (key: string): string | null => {
  if (key === " ") {
    return "<space>";
  }

  if (key.length === 1) {
    return key;
  }

  return null;
};

const isModifierKey = (key: string): boolean =>
  key === "Shift" || key === "Control" || key === "Alt" || key === "Meta";

const getKeyToken = (event: KeyboardEvent): string | null => {
  const normalizedKey = normalizeBaseKey(event.key);

  if (!normalizedKey) {
    return null;
  }

  const modifiers: string[] = [];

  if (event.ctrlKey) {
    modifiers.push("c");
  }

  if (event.metaKey) {
    modifiers.push("m");
  }

  if (event.altKey) {
    modifiers.push("a");
  }

  if (modifiers.length > 0) {
    return `<${modifiers.join("-")}-${normalizedKey}>`;
  }

  return normalizedKey;
};

const applyHotkeyMappings = (
  mappings: Partial<Record<string, ActionName>>,
  prefixes: Partial<Record<string, true>>
): void => {
  keyActions = mappings;
  keyActionPrefixes = prefixes;
  setReservedHintPrefixes(getReservedHintPrefixes(mappings));
  clearPendingState();
};

const applyUrlRules = (rules: FastConfig["rules"]["urls"]): void => {
  urlRulesMode = rules.mode;
  urlBlacklistRules = rules.blacklist;
  urlWhitelistRules = rules.whitelist;
  clearPendingState();
};

const getCurrentUrlRule = (): FastRule | null => {
  const currentUrl = window.location.href;
  const activeRules = urlRulesMode === "whitelist" ? urlWhitelistRules : urlBlacklistRules;

  for (const rule of activeRules) {
    if (new RegExp(rule.pattern).test(currentUrl)) {
      return rule;
    }
  }

  return null;
};

const isActionAllowedForRule = (actionName: ActionName, rule: FastRule | null): boolean => {
  if (!rule) {
    return true;
  }

  const isListedAction = rule.actions[actionName] === true;

  if (rule.mode === "allow") {
    return isListedAction;
  }

  return !isListedAction;
};

const isActionAllowed = (actionName: ActionName): boolean => {
  return isActionAllowedForRule(actionName, getCurrentUrlRule());
};

const getAllowedActionForSequence = (sequence: string): ActionName | null => {
  const actionName = keyActions[sequence] ?? null;

  if (!actionName || !isActionAllowed(actionName)) {
    return null;
  }

  return actionName;
};

const hasAllowedActionPrefix = (
  sequence: string,
  predicate?: (actionName: ActionName) => boolean
): boolean => {
  const rule = getCurrentUrlRule();

  return Object.entries(keyActions).some(([candidate, actionName]) => {
    if (!actionName || candidate.length <= sequence.length || !candidate.startsWith(sequence)) {
      return false;
    }

    if (predicate && !predicate(actionName)) {
      return false;
    }

    return isActionAllowedForRule(actionName, rule);
  });
};

const hasAllowedActionMappings = (): boolean => {
  const rule = getCurrentUrlRule();

  return Object.values(keyActions).some((actionName) => {
    return actionName ? isActionAllowedForRule(actionName, rule) : false;
  });
};

const blurActiveEditableTarget = (): boolean => {
  const activeElement = getDeepActiveElement();

  if (!(activeElement instanceof HTMLElement) || !isEditableTarget(activeElement)) {
    return false;
  }

  activeElement.blur();
  return true;
};

const clearPendingSequence = (): void => {
  pendingSequence = "";

  if (pendingSequenceTimer !== null) {
    window.clearTimeout(pendingSequenceTimer);
    pendingSequenceTimer = null;
  }
};

const clearPendingCount = (): void => {
  pendingCount = "";
};

const clearPendingState = (): void => {
  clearPendingSequence();
  clearPendingCount();
};

const startPendingSequence = (sequence: string): void => {
  clearPendingSequence();
  pendingSequence = sequence;

  pendingSequenceTimer = window.setTimeout(() => {
    clearPendingSequence();
  }, KEY_SEQUENCE_TIMEOUT_MS);
};

const isCountKey = (key: string): boolean => {
  if (pendingCount) {
    return key >= "0" && key <= "9";
  }

  return key >= "1" && key <= "9";
};

const getReservedHintPrefixes = (mappings: Partial<Record<string, ActionName>>): Set<string> => {
  const reservedPrefixes = new Set<string>();

  for (const [sequence, actionName] of Object.entries(mappings)) {
    if (actionName !== "toggle-hints-current-tab" && actionName !== "toggle-hints-new-tab") {
      continue;
    }

    const firstCharacter = sequence[0]?.toLowerCase();
    if (firstCharacter && /[a-z]/.test(firstCharacter)) {
      reservedPrefixes.add(firstCharacter);
    }
  }

  return reservedPrefixes;
};

const consumeCountKey = (key: string): void => {
  pendingCount = pendingSequence ? key : `${pendingCount}${key}`;
  clearPendingSequence();
};

const resolveCount = (): number => {
  const count = pendingCount ? Number.parseInt(pendingCount, 10) : 1;
  clearPendingCount();
  return count;
};

const getActionName = (keyToken: string): KeyParseResult => {
  if (isCountKey(keyToken) && hasAllowedActionMappings()) {
    consumeCountKey(keyToken);
    return { actionName: null, consumed: true };
  }

  const nextSequence = `${pendingSequence}${keyToken}`;
  const directMatch = getAllowedActionForSequence(nextSequence);

  if (directMatch) {
    clearPendingSequence();
    return { actionName: directMatch, consumed: true };
  }

  const hasLongerMatch =
    keyActionPrefixes[nextSequence] === true && hasAllowedActionPrefix(nextSequence);

  if (hasLongerMatch) {
    startPendingSequence(nextSequence);
    return { actionName: null, consumed: true };
  }

  clearPendingSequence();

  const actionName = getAllowedActionForSequence(keyToken);

  if (!actionName) {
    clearPendingCount();
    return { actionName: null, consumed: false };
  }

  return { actionName, consumed: true };
};

const getWatchActionName = (keyToken: string): KeyParseResult => {
  const fullscreenSequence = getWatchActionSequence("toggle-fullscreen", "f");
  const pauseSequence = getWatchActionSequence("toggle-play-pause", "k");
  const nextSequence = `${pendingSequence}${keyToken}`;

  if (nextSequence === fullscreenSequence) {
    clearPendingSequence();
    return { actionName: "toggle-fullscreen", consumed: true };
  }

  if (nextSequence === pauseSequence) {
    clearPendingSequence();
    return { actionName: "toggle-play-pause", consumed: true };
  }

  if (fullscreenSequence.startsWith(nextSequence) || pauseSequence.startsWith(nextSequence)) {
    startPendingSequence(nextSequence);
    return { actionName: null, consumed: true };
  }

  clearPendingSequence();
  return { actionName: null, consumed: false };
};

const isToggleHintsAction = (
  actionName: ActionName | null
): actionName is "toggle-hints-current-tab" | "toggle-hints-new-tab" =>
  actionName === "toggle-hints-current-tab" || actionName === "toggle-hints-new-tab";

const getToggleHintsActionName = (keyToken: string): KeyParseResult => {
  const nextSequence = `${pendingSequence}${keyToken}`;
  const directMatch = getAllowedActionForSequence(nextSequence);

  if (isToggleHintsAction(directMatch ?? null)) {
    clearPendingSequence();
    return { actionName: directMatch ?? null, consumed: true };
  }

  const hasLongerToggleMatch = hasAllowedActionPrefix(nextSequence, (actionName) =>
    isToggleHintsAction(actionName)
  );

  if (hasLongerToggleMatch) {
    startPendingSequence(nextSequence);
    return { actionName: null, consumed: true };
  }

  clearPendingSequence();
  return { actionName: null, consumed: false };
};

const fastConfigSyncDeps = {
  applyHotkeyMappings,
  applyUrlRules,
  setWatchShowCapitalizedLetters: (value: boolean): void => {
    watchShowCapitalizedLetters = value;
  },
  setWatchHighlightThumbnails: (value: boolean): void => {
    watchHighlightThumbnails = value;
  },
  setShowActivationIndicator: (value: boolean): void => {
    showActivationIndicator = value;
  },
  setActivationIndicatorColor: (value: string): void => {
    activationIndicatorColor = value;
  },
  syncFocusStyles: (): void => {
    syncFocusStyles(FOCUS_STYLE_ID, renderFocusStyles);
  },
  syncWatchHintsOverlay
};

const handleStorageChange = createStorageChangeHandler(fastConfigSyncDeps);

const handleKeydown = (event: KeyboardEvent): void => {
  if (areHintsActive()) {
    const keyToken = getKeyToken(event);

    if (keyToken && (pendingSequence || areHintsPendingSelection())) {
      const { actionName, consumed } = getToggleHintsActionName(keyToken);

      if (isToggleHintsAction(actionName)) {
        if (ACTIONS[actionName]()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      } else if (consumed) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }

    if (handleHintsKeydown(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    return;
  }

  if (event.key === "Escape" && isWatchModeActive()) {
    exitWatchMode();
    clearPendingState();
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  if (event.key === "Escape" && isFindModeActive()) {
    exitFindMode();
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  if (isFindModeActive() && (isFindUiElement(event.target) || isFindInputFocused())) {
    clearPendingState();

    if (event.key !== "Escape") {
      event.stopImmediatePropagation();
    }

    return;
  }

  if (event.key === "Escape" && blurActiveEditableTarget()) {
    clearPendingState();
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  if (isEditableTarget(getDeepActiveElement())) {
    clearPendingState();
    return;
  }

  const keyToken = getKeyToken(event);

  if (!keyToken) {
    if (isModifierKey(event.key)) {
      return;
    }

    clearPendingState();
    return;
  }

  if (isWatchModeActive()) {
    const { actionName: watchActionName, consumed: consumedWatchKey } =
      getWatchActionName(keyToken);

    if (watchActionName === "toggle-fullscreen" && toggleFullscreen()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (watchActionName === "toggle-play-pause" && toggleWatchPlayPause()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (consumedWatchKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }

  const { actionName, consumed } = getActionName(keyToken);

  if (!actionName) {
    if (consumed) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    return;
  }

  if (!isActionAllowed(actionName)) {
    clearPendingCount();
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  const didHandle = ACTIONS[actionName](resolveCount());

  if (!didHandle && !isScrollAction(actionName)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
};

const ensureFindStyles = (root: ShadowRoot): void => {
  if (!root) {
    return;
  }

  const existingStyle = root.getElementById(FIND_STYLE_ID);

  if (existingStyle instanceof HTMLStyleElement) {
    existingStyle.textContent = renderFindStyles();
    return;
  }

  const style = document.createElement("style");
  style.id = FIND_STYLE_ID;
  style.textContent = renderFindStyles();
  root.append(style);
};

const getFocusOverlay = (): HTMLDivElement => {
  const existing = document.getElementById(FOCUS_OVERLAY_ID);

  if (existing instanceof HTMLDivElement) {
    return existing;
  }

  const overlay = document.createElement("div");
  overlay.id = FOCUS_OVERLAY_ID;
  overlay.setAttribute("data-visible", "false");
  overlay.setAttribute("data-animate", "false");
  overlay.setAttribute("data-hiding", "false");
  document.documentElement.append(overlay);
  return overlay;
};

const isFindUiElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof Node)) {
    return false;
  }

  return (
    getFindOverlay()?.contains(target) === true ||
    getFindBar()?.contains(target) === true ||
    getFindStatus()?.contains(target) === true
  );
};

const ensureFindUi = (): void => {
  if (getFindBar() && getFindStatus()) {
    return;
  }

  const existingOverlay = getFindOverlay();
  const overlay = existingOverlay ?? document.createElement("div");
  overlay.id = FIND_OVERLAY_ID;
  overlay.style.all = "initial";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "2147483647";

  const root = overlay.shadowRoot ?? overlay.attachShadow({ mode: "open" });
  ensureFindStyles(root);

  const bar = document.createElement("div");
  bar.id = FIND_BAR_ID;
  bar.setAttribute("data-visible", "false");
  const icon = document.createElement("span");
  icon.className = "nav-find-icon";
  icon.setAttribute("data-find-icon", "");
  icon.appendChild(createFindIconSvg(SEARCH_ICON_NODES));

  const input = document.createElement("input");
  input.id = FIND_INPUT_ID;
  input.type = "text";
  input.spellcheck = false;
  input.autocomplete = "off";
  input.placeholder = "find...";

  const actions = document.createElement("div");
  actions.className = "nav-find-bar-actions";

  const matchCount = document.createElement("span");
  matchCount.id = FIND_MATCH_COUNT_ID;
  matchCount.textContent = "0 Matches";

  const clearButton = document.createElement("button");
  clearButton.id = FIND_CLEAR_BUTTON_ID;
  clearButton.className = "nav-find-clear";
  clearButton.type = "button";
  clearButton.setAttribute("aria-label", "Clear find input");
  clearButton.appendChild(createFindIconSvg(CLOSE_ICON_NODES));

  actions.append(matchCount, clearButton);
  bar.append(icon, input, actions);

  const status = document.createElement("div");
  status.id = FIND_STATUS_ID;
  status.setAttribute("data-visible", "false");
  const statusText = document.createElement("span");
  statusText.id = FIND_STATUS_TEXT_ID;
  statusText.textContent = "0 / 0";

  const prevButton = document.createElement("button");
  prevButton.id = FIND_PREV_BUTTON_ID;
  prevButton.className = "nav-find-nav";
  prevButton.setAttribute("data-find-nav", "");
  prevButton.type = "button";
  prevButton.setAttribute("aria-label", "Previous match");
  prevButton.appendChild(createFindIconSvg(ARROW_UP_ICON_NODES));

  const nextButton = document.createElement("button");
  nextButton.id = FIND_NEXT_BUTTON_ID;
  nextButton.className = "nav-find-nav";
  nextButton.setAttribute("data-find-nav", "");
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Next match");
  nextButton.appendChild(createFindIconSvg(ARROW_DOWN_ICON_NODES));

  status.append(statusText, prevButton, nextButton);
  root.append(bar, status);

  if (!existingOverlay) {
    document.documentElement.append(overlay);
  }

  input?.addEventListener("input", () => {
    setFindQuery(input.value);
  });

  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      commitFindQuery();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.key === "Escape") {
      exitFindMode();
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
  });

  getFindPrevButton()?.addEventListener("click", () => {
    cycleFindMatch(-1);
  });

  getFindNextButton()?.addEventListener("click", () => {
    cycleFindMatch(1);
  });

  getFindClearButton()?.addEventListener("click", () => {
    clearFindInput();
  });

  updateFindUiCounts();
  syncFindStatusVisibility();
};

const clearFocusOverlayFrame = (): void => {
  if (focusOverlayFrame === null) {
    return;
  }

  window.cancelAnimationFrame(focusOverlayFrame);
  focusOverlayFrame = null;
};

const clearFocusOverlayTimeout = (): void => {
  if (focusOverlayTimeout === null) {
    return;
  }

  window.clearTimeout(focusOverlayTimeout);
  focusOverlayTimeout = null;
};

const finishHidingFocusOverlay = (): void => {
  const overlay = getFocusOverlay();
  overlay.setAttribute("data-visible", "false");
  overlay.setAttribute("data-animate", "false");
  overlay.setAttribute("data-hiding", "false");
};

const hideFocusOverlay = (): void => {
  focusedOverlayTarget = null;
  clearFocusOverlayFrame();
  clearFocusOverlayTimeout();

  const overlay = getFocusOverlay();
  if (overlay.getAttribute("data-visible") !== "true") {
    finishHidingFocusOverlay();
    return;
  }

  overlay.setAttribute("data-animate", "false");
  overlay.setAttribute("data-hiding", "true");

  focusOverlayTimeout = window.setTimeout(() => {
    finishHidingFocusOverlay();
    focusOverlayTimeout = null;
  }, FOCUS_OVERLAY_FADE_OUT_MS);
};

const updateFocusOverlayPosition = (): void => {
  if (!focusedOverlayTarget || !focusedOverlayTarget.isConnected) {
    hideFocusOverlay();
    return;
  }

  const rect = focusedOverlayTarget.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    hideFocusOverlay();
    return;
  }

  const overlay = getFocusOverlay();
  const horizontalInset = 3;
  const verticalInset = 2;
  const targetHeight = rect.height + verticalInset * 2;
  const centeredTop = rect.top + rect.height / 2 - targetHeight / 2;

  overlay.style.top = `${Math.round(centeredTop)}px`;
  overlay.style.left = `${Math.round(rect.left - horizontalInset)}px`;
  overlay.style.width = `${Math.round(rect.width + horizontalInset * 2)}px`;
  overlay.style.height = `${Math.round(targetHeight)}px`;
  overlay.style.borderRadius = "0.375rem";
  overlay.style.boxShadow = `0 0 0 2px ${colorToRgba(activationIndicatorColor, 0.95)}`;
  overlay.setAttribute("data-hiding", "false");
  overlay.setAttribute("data-visible", "true");
};

const scheduleFocusOverlayPosition = (): void => {
  if (focusOverlayFrame !== null) {
    return;
  }

  focusOverlayFrame = window.requestAnimationFrame(() => {
    focusOverlayFrame = null;
    updateFocusOverlayPosition();
  });
};

const animateFocusOverlay = (): void => {
  const overlay = getFocusOverlay();
  overlay.setAttribute("data-animate", "false");
  overlay.setAttribute("data-visible", "true");

  void overlay.offsetWidth;

  overlay.setAttribute("data-animate", "true");
};

const handleFocusIndicator = (event: Event): void => {
  if (!showActivationIndicator) {
    return;
  }

  const target = (event as CustomEvent<{ element?: HTMLElement }>).detail?.element;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  focusedOverlayTarget = target;
  clearFocusOverlayTimeout();
  updateFocusOverlayPosition();
  animateFocusOverlay();

  focusOverlayTimeout = window.setTimeout(() => {
    hideFocusOverlay();
  }, FOCUS_OVERLAY_HIDE_MS);
};

const handleEditableBeforeInput = (event: Event): void => {
  if (!isEditableTarget(event.target) && !isEditableTarget(getDeepActiveElement())) {
    return;
  }

  hideFocusOverlay();
};

const handleWatchMediaStateChange = (): void => {
  if (!watchModeActive) {
    return;
  }

  syncWatchHintsOverlay();
};

export const initCoreNavigation = (): void => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  installScrollTracking();
  if (!isOptionsPage()) {
    ensureFocusStyles(FOCUS_STYLE_ID, renderFocusStyles);
    getFocusOverlay();
    ensureFindUi();
    window.addEventListener(FOCUS_INDICATOR_EVENT, handleFocusIndicator as EventListener, true);
    window.addEventListener("beforeinput", handleEditableBeforeInput, true);
    window.addEventListener("compositionstart", handleEditableBeforeInput, true);
    window.addEventListener("resize", scheduleFocusOverlayPosition, true);
    window.addEventListener("scroll", scheduleFocusOverlayPosition, true);
    window.addEventListener("resize", syncWatchHintsOverlay, true);
    window.addEventListener("scroll", syncWatchHintsOverlay, true);
    document.addEventListener("fullscreenchange", syncWatchHintsOverlay, true);
    document.addEventListener("play", handleWatchMediaStateChange, true);
    document.addEventListener("pause", handleWatchMediaStateChange, true);
    document.addEventListener("ended", handleWatchMediaStateChange, true);
    document.addEventListener("mousedown", (event) => {
      if (!isFindUiElement(event.target)) {
        hideFindBar();
      }
    });
  }
  ensureToastWrapper();
  syncFastConfig(fastConfigSyncDeps);

  chrome.storage.onChanged.addListener(handleStorageChange);
  window.addEventListener("keydown", handleKeydown, true);
};
