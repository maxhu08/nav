import {
  activateHints,
  areHintsActive,
  areHintsPendingSelection,
  exitHints,
  handleHintsKeydown,
  setAvoidedAdjacentHintPairs,
  setHighlightThumbnails,
  setHintCSS,
  setHintCharset,
  setPreferredSearchLabels,
  setReservedHintPrefixes,
  setShowCapitalizedLetters
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
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/isEditableTarget";
import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";
import { getExtensionNamespace } from "~/src/utils/extension-id";
import { type FastConfig, type FastRule, getFastConfig } from "~/src/utils/fast-config";
import { type ActionName } from "~/src/utils/hotkeys";
import { DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR } from "~/src/utils/config";

type ActionHandler = (count?: number) => boolean;
type TabCommand =
  | "tab-go-prev"
  | "tab-go-next"
  | "duplicate-current-tab"
  | "move-current-tab-to-new-window"
  | "close-current-tab"
  | "create-new-tab"
  | "reload-current-tab"
  | "reload-current-tab-hard";
type TabCommandResponse = { ok: boolean };
type FetchImageResponse = {
  ok: boolean;
  bytes?: number[];
  mimeType?: string;
};

type ImageClipboardResult = "success" | "unsupported" | "error";
type FindMatch = {
  range: Range;
  element: HTMLElement;
};

let keyActions: Partial<Record<string, ActionName>> = {};
let keyActionPrefixes: Partial<Record<string, true>> = {};
let urlRulesMode: FastConfig["rules"]["urls"]["mode"] = "blacklist";
let urlBlacklistRules: FastRule[] = [];
let urlWhitelistRules: FastRule[] = [];

const writeClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }
};

const writeClipboardImage = async (image: HTMLImageElement): Promise<ImageClipboardResult> => {
  if (typeof ClipboardItem === "undefined" || typeof navigator.clipboard?.write !== "function") {
    return "unsupported";
  }

  const source = image.currentSrc || image.src;
  if (!source) {
    return "error";
  }

  const convertBlobToClipboardBlob = async (blob: Blob): Promise<Blob | null> => {
    if (!blob.type.startsWith("image/")) {
      return null;
    }

    try {
      if (blob.type === "image/png") {
        return blob;
      }

      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const context = canvas.getContext("2d");
      if (!context) {
        bitmap.close();
        return null;
      }

      context.drawImage(bitmap, 0, 0);
      bitmap.close();

      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((nextBlob) => resolve(nextBlob), "image/png");
      });
    } catch {
      return null;
    }
  };

  const writeBlobToClipboard = async (blob: Blob): Promise<ImageClipboardResult> => {
    const clipboardBlob = await convertBlobToClipboardBlob(blob);
    if (!clipboardBlob) {
      return "error";
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [clipboardBlob.type]: clipboardBlob
        })
      ]);

      return "success";
    } catch {
      return "error";
    }
  };

  const fetchImageBlobFromBackground = async (): Promise<Blob | null> => {
    try {
      const response = await new Promise<FetchImageResponse>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "fetch-image",
            url: source
          },
          (result?: FetchImageResponse) => {
            resolve(result ?? { ok: false });
          }
        );
      });

      if (!response.ok || !response.mimeType || !response.bytes) {
        return null;
      }

      return new Blob([new Uint8Array(response.bytes)], { type: response.mimeType });
    } catch {
      return null;
    }
  };

  try {
    const response = await fetch(source);
    if (!response.ok) {
      const backgroundBlob = await fetchImageBlobFromBackground();
      if (!backgroundBlob) {
        return "error";
      }

      return writeBlobToClipboard(backgroundBlob);
    }

    const blob = await response.blob();
    return writeBlobToClipboard(blob);
  } catch {
    const backgroundBlob = await fetchImageBlobFromBackground();
    if (!backgroundBlob) {
      return "error";
    }

    return writeBlobToClipboard(backgroundBlob);
  }
};

const getNormalizedUrl = (value: string): string => {
  const url = new URL(value);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");

  return `${url.origin}${pathname}${url.search}${url.hash}`;
};

const getNormalizedCurrentUrl = (): string => getNormalizedUrl(window.location.href);

const getLinkUrl = (element: HTMLElement): string | null => {
  if (
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
    element.href
  ) {
    return getNormalizedUrl(element.href);
  }

  return null;
};

const getImageUrl = (element: HTMLElement): string | null => {
  if (!(element instanceof HTMLImageElement)) {
    return null;
  }

  const source = element.currentSrc || element.src;
  if (!source) {
    return null;
  }

  return getNormalizedUrl(source);
};

const showYankToast = (type: "success" | "error", message: string, description: string): void => {
  ensureToastWrapper();
  const toast = getToastApi();

  if (type === "success") {
    toast?.success(message, { description });
    return;
  }

  toast?.error(message, { description });
};

const showImageYankToast = (image: HTMLImageElement): void => {
  ensureToastWrapper();
  const toast = getToastApi();
  const source = image.currentSrc || image.src;
  const altText = image.alt.trim();
  const captionText = /^(true|false)$/i.test(altText) ? "" : altText;
  const toastEl = toast?.success("Image yanked", { description: " " });

  if (!(toastEl instanceof HTMLElement) || !source) {
    return;
  }

  const descriptionEl = toastEl.querySelector("[data-description]");
  if (!(descriptionEl instanceof HTMLElement)) {
    return;
  }

  descriptionEl.textContent = "";
  descriptionEl.style.whiteSpace = "normal";
  descriptionEl.style.overflow = "visible";
  descriptionEl.style.textOverflow = "clip";
  descriptionEl.style.marginTop = "8px";

  const preview = document.createElement("img");
  preview.src = source;
  preview.alt = captionText || "Yanked image preview";
  preview.style.display = "block";
  preview.style.width = "100%";
  preview.style.maxHeight = "160px";
  preview.style.objectFit = "contain";
  preview.style.borderRadius = "8px";
  preview.style.background = "rgba(255, 255, 255, 0.04)";
  descriptionEl.append(preview);

  if (captionText) {
    const caption = document.createElement("div");
    caption.textContent = captionText;
    caption.style.marginTop = "8px";
    caption.style.color = "#a3a3a3";
    caption.style.fontSize = "14px";
    caption.style.lineHeight = "20px";
    descriptionEl.append(caption);
  }
};

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

const yankCurrentTabUrl = (): boolean => {
  const currentUrl = getNormalizedCurrentUrl();

  void writeClipboard(currentUrl).then((didCopy) => {
    if (didCopy) {
      showYankToast("success", "Current tab URL yanked", currentUrl);
      return;
    }

    showYankToast("error", "Could not yank current tab URL", "Clipboard access was denied.");
  });

  return true;
};

const yankLinkUrl = (): boolean => {
  const didActivate = activateHints("copy-link", {
    onActivate: (element) => {
      const linkUrl = getLinkUrl(element);

      if (!linkUrl) {
        showYankToast("error", "Could not yank link URL", "The selected target is not a link.");
        return;
      }

      void writeClipboard(linkUrl).then((didCopy) => {
        if (didCopy) {
          showYankToast("success", "Link URL yanked", linkUrl);
          return;
        }

        showYankToast("error", "Could not yank link URL", "Clipboard access was denied.");
      });
    }
  });

  if (!didActivate) {
    showYankToast("error", "Could not yank link URL", "No visible links were found.");
  }

  return true;
};

const yankImage = (): boolean => {
  const didActivate = activateHints("copy-image", {
    onActivate: (element) => {
      if (!(element instanceof HTMLImageElement)) {
        showYankToast("error", "Could not yank image", "The selected target is not an image.");
        return;
      }

      void writeClipboardImage(element).then((result) => {
        if (result === "success") {
          showImageYankToast(element);
          return;
        }

        if (result === "unsupported") {
          showYankToast("error", "Could not yank image", "Image clipboard support is unavailable.");
          return;
        }

        showYankToast("error", "Could not yank image", "The image could not be copied.");
      });
    }
  });

  if (!didActivate) {
    showYankToast("error", "Could not yank image", "No visible images were found.");
  }

  return true;
};

const yankImageUrl = (): boolean => {
  const didActivate = activateHints("copy-image", {
    onActivate: (element) => {
      const imageUrl = getImageUrl(element);

      if (!imageUrl) {
        showYankToast("error", "Could not yank image URL", "The selected target is not an image.");
        return;
      }

      void writeClipboard(imageUrl).then((didCopy) => {
        if (didCopy) {
          showYankToast("success", "Image URL yanked", imageUrl);
          return;
        }

        showYankToast("error", "Could not yank image URL", "Clipboard access was denied.");
      });
    }
  });

  if (!didActivate) {
    showYankToast("error", "Could not yank image URL", "No visible images were found.");
  }

  return true;
};

const goHistory = (offset: number): boolean => {
  if (offset === 0 || window.history.length < 1) {
    return false;
  }

  window.history.go(offset);
  return true;
};

const getCurrentExtensionPageTabContext = async (): Promise<{
  tabId?: number;
  tabIndex?: number;
  windowId?: number;
}> => {
  if (typeof chrome.tabs?.getCurrent !== "function") {
    return {};
  }

  return new Promise((resolve) => {
    chrome.tabs.getCurrent((tab) => {
      if (chrome.runtime.lastError || !tab) {
        resolve({});
        return;
      }

      resolve({
        tabId: tab.id,
        tabIndex: tab.index,
        windowId: tab.windowId
      });
    });
  });
};

const runTabCommand = (command: TabCommand): boolean => {
  void getCurrentExtensionPageTabContext().then((tabContext) => {
    chrome.runtime.sendMessage(
      {
        type: "tab-command",
        command,
        ...tabContext
      },
      (response?: TabCommandResponse) => {
        if (response?.ok) {
          return;
        }

        const toast = getToastApi();
        const actionLabel =
          command === "tab-go-prev"
            ? "go to previous tab"
            : command === "tab-go-next"
              ? "go to next tab"
              : command === "duplicate-current-tab"
                ? "duplicate current tab"
                : command === "move-current-tab-to-new-window"
                  ? "move current tab to new window"
                  : command === "close-current-tab"
                    ? "close current tab"
                    : command === "create-new-tab"
                      ? "create new tab"
                      : command === "reload-current-tab"
                        ? "reload current tab"
                        : "hard reload current tab";

        toast?.error(`Could not ${actionLabel}`);
      }
    );
  });

  return true;
};

const isOptionsPage = (): boolean => {
  const optionsUrl = chrome.runtime.getURL("options.html");
  return window.location.href === optionsUrl;
};

const ACTIONS: Record<ActionName, ActionHandler> = {
  "enable-find-mode": openFindMode,
  "cycle-match-next": () => cycleFindMatch(1),
  "cycle-match-prev": () => cycleFindMatch(-1),
  "history-go-prev": (count = 1) => goHistory(-count),
  "history-go-next": (count = 1) => goHistory(count),
  "tab-go-prev": () => runTabCommand("tab-go-prev"),
  "tab-go-next": () => runTabCommand("tab-go-next"),
  "duplicate-current-tab": () => runTabCommand("duplicate-current-tab"),
  "move-current-tab-to-new-window": () => runTabCommand("move-current-tab-to-new-window"),
  "close-current-tab": () => runTabCommand("close-current-tab"),
  "create-new-tab": () => runTabCommand("create-new-tab"),
  "reload-current-tab": () => runTabCommand("reload-current-tab"),
  "reload-current-tab-hard": () => runTabCommand("reload-current-tab-hard"),
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
    z-index: 2147483647;
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

const syncFocusStyles = (): void => {
  const style = document.getElementById(FOCUS_STYLE_ID);

  if (style instanceof HTMLStyleElement) {
    style.textContent = renderFocusStyles();
  }
};

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

const isActionAllowed = (actionName: ActionName): boolean => {
  const rule = getCurrentUrlRule();

  if (!rule) {
    return true;
  }

  const isListedAction = rule.actions[actionName] === true;

  if (rule.mode === "allow") {
    return isListedAction;
  }

  return !isListedAction;
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
  if (isCountKey(keyToken)) {
    consumeCountKey(keyToken);
    return { actionName: null, consumed: true };
  }

  const nextSequence = `${pendingSequence}${keyToken}`;
  const directMatch = keyActions[nextSequence];

  if (directMatch) {
    clearPendingSequence();
    return { actionName: directMatch, consumed: true };
  }

  const hasLongerMatch = keyActionPrefixes[nextSequence] === true;

  if (hasLongerMatch) {
    startPendingSequence(nextSequence);
    return { actionName: null, consumed: true };
  }

  clearPendingSequence();

  const actionName = keyActions[keyToken] ?? null;

  if (!actionName) {
    clearPendingCount();
    return { actionName: null, consumed: false };
  }

  return { actionName, consumed: true };
};

const isToggleHintsAction = (
  actionName: ActionName | null
): actionName is "toggle-hints-current-tab" | "toggle-hints-new-tab" =>
  actionName === "toggle-hints-current-tab" || actionName === "toggle-hints-new-tab";

const getToggleHintsActionName = (keyToken: string): KeyParseResult => {
  const nextSequence = `${pendingSequence}${keyToken}`;
  const directMatch = keyActions[nextSequence];

  if (isToggleHintsAction(directMatch ?? null)) {
    clearPendingSequence();
    return { actionName: directMatch ?? null, consumed: true };
  }

  const hasLongerToggleMatch = Object.entries(keyActions).some(
    ([sequence, actionName]) =>
      isToggleHintsAction(actionName ?? null) && sequence.startsWith(nextSequence)
  );

  if (hasLongerToggleMatch) {
    startPendingSequence(nextSequence);
    return { actionName: null, consumed: true };
  }

  clearPendingSequence();
  return { actionName: null, consumed: false };
};

const syncFastConfig = (): void => {
  void getFastConfig().then((fastConfig) => {
    applyUrlRules(fastConfig.rules.urls);
    setHintCharset(fastConfig.hints.charset);
    setAvoidedAdjacentHintPairs(fastConfig.hints.avoidAdjacentPairs);
    setPreferredSearchLabels(fastConfig.hints.preferredSearchLabels);
    setShowCapitalizedLetters(fastConfig.hints.showCapitalizedLetters);
    setHighlightThumbnails(fastConfig.hints.improveThumbnailMarkers);
    setHintCSS(fastConfig.hints.css);
    showActivationIndicator = fastConfig.hints.showActivationIndicator;
    activationIndicatorColor = fastConfig.hints.showActivationIndicatorColor;
    syncFocusStyles();
    applyHotkeyMappings(fastConfig.hotkeys.mappings, fastConfig.hotkeys.prefixes);
  });
};

const handleStorageChange = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
): void => {
  if (areaName !== "local" || !changes.fastConfig?.newValue) {
    return;
  }

  const nextFastConfig = changes.fastConfig.newValue as FastConfig;

  applyUrlRules(nextFastConfig.rules.urls);
  setHintCharset(nextFastConfig.hints.charset);
  setAvoidedAdjacentHintPairs(nextFastConfig.hints.avoidAdjacentPairs);
  setPreferredSearchLabels(nextFastConfig.hints.preferredSearchLabels);
  setShowCapitalizedLetters(nextFastConfig.hints.showCapitalizedLetters);
  setHighlightThumbnails(nextFastConfig.hints.improveThumbnailMarkers);
  setHintCSS(nextFastConfig.hints.css);
  showActivationIndicator = nextFastConfig.hints.showActivationIndicator;
  activationIndicatorColor = nextFastConfig.hints.showActivationIndicatorColor;
  syncFocusStyles();
  applyHotkeyMappings(nextFastConfig.hotkeys.mappings, nextFastConfig.hotkeys.prefixes);
};

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

const ensureFocusStyles = (): void => {
  const existingStyle = document.getElementById(FOCUS_STYLE_ID);

  if (existingStyle instanceof HTMLStyleElement) {
    existingStyle.textContent = renderFocusStyles();
    return;
  }

  const style = document.createElement("style");
  style.id = FOCUS_STYLE_ID;
  style.textContent = renderFocusStyles();

  const styleRoot = document.head ?? document.documentElement;
  styleRoot.append(style);
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

export const initCoreNavigation = (): void => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  installScrollTracking();
  if (!isOptionsPage()) {
    ensureFocusStyles();
    getFocusOverlay();
    ensureFindUi();
    window.addEventListener(FOCUS_INDICATOR_EVENT, handleFocusIndicator as EventListener, true);
    window.addEventListener("beforeinput", handleEditableBeforeInput, true);
    window.addEventListener("compositionstart", handleEditableBeforeInput, true);
    window.addEventListener("resize", scheduleFocusOverlayPosition, true);
    window.addEventListener("scroll", scheduleFocusOverlayPosition, true);
    document.addEventListener("mousedown", (event) => {
      if (!isFindUiElement(event.target)) {
        hideFindBar();
      }
    });
  }
  ensureToastWrapper();
  syncFastConfig();

  chrome.storage.onChanged.addListener(handleStorageChange);
  window.addEventListener("keydown", handleKeydown, true);
};
