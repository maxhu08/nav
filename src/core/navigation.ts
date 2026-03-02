import {
  activateHints,
  areHintsActive,
  areHintsPendingSelection,
  exitHints,
  handleHintsKeydown,
  setAvoidedAdjacentHintPairs,
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
import { type FastRule, getFastConfig } from "~/src/utils/fast-config";
import { type ActionName } from "~/src/utils/hotkeys";
import { DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR } from "~/src/utils/config";

type ActionHandler = (count?: number) => boolean;
type TabCommand = "close-current-tab" | "create-new-tab" | "reload-current-tab";
type TabCommandResponse = { ok: boolean };

let keyActions: Partial<Record<string, ActionName>> = {};
let keyActionPrefixes: Partial<Record<string, true>> = {};
let urlRules: FastRule[] = [];

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

const getNormalizedCurrentUrl = (): string => {
  const url = new URL(window.location.href);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");

  return `${url.origin}${pathname}${url.search}${url.hash}`;
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
          command === "close-current-tab"
            ? "close current tab"
            : command === "create-new-tab"
              ? "create new tab"
              : "reload current tab";

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
  "close-current-tab": () => runTabCommand("close-current-tab"),
  "create-new-tab": () => runTabCommand("create-new-tab"),
  "reload-current-tab": () => runTabCommand("reload-current-tab"),
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

let focusedOverlayTarget: HTMLElement | null = null;
let focusOverlayFrame: number | null = null;
let focusOverlayTimeout: number | null = null;
let showActivationIndicator = true;
let activationIndicatorColor = DEFAULT_HINT_ACTIVATION_INDICATOR_COLOR;

type KeyParseResult = {
  actionName: ActionName | null;
  consumed: boolean;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const normalizedHex = hex.replace("#", "");
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const applyActivationIndicatorColor = (overlay: HTMLDivElement = getFocusOverlay()): void => {
  overlay.style.setProperty(
    "--nav-focus-ring-outer-strong",
    hexToRgba(activationIndicatorColor, 0.38)
  );
  overlay.style.setProperty(
    "--nav-focus-ring-inner-strong",
    hexToRgba(activationIndicatorColor, 0.95)
  );
  overlay.style.setProperty(
    "--nav-focus-ring-outer-medium",
    hexToRgba(activationIndicatorColor, 0.18)
  );
  overlay.style.setProperty(
    "--nav-focus-ring-inner-medium",
    hexToRgba(activationIndicatorColor, 0.95)
  );
  overlay.style.setProperty(
    "--nav-focus-ring-outer-soft",
    hexToRgba(activationIndicatorColor, 0.06)
  );
  overlay.style.setProperty(
    "--nav-focus-ring-inner-soft",
    hexToRgba(activationIndicatorColor, 0.92)
  );
  overlay.style.setProperty(
    "--nav-focus-ring-outer-fade",
    hexToRgba(activationIndicatorColor, 0.02)
  );
  overlay.style.setProperty("--nav-focus-ring-inner-fade", hexToRgba(activationIndicatorColor, 0));
  overlay.style.setProperty("--nav-focus-ring-static", hexToRgba(activationIndicatorColor, 0.95));
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

const applyUrlRules = (rules: FastRule[]): void => {
  urlRules = rules;
  clearPendingState();
};

const getCurrentUrlRule = (): FastRule | null => {
  const currentUrl = window.location.href;

  for (const rule of urlRules) {
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
    setHintCSS(fastConfig.hints.css);
    showActivationIndicator = fastConfig.hints.showActivationIndicator;
    activationIndicatorColor = fastConfig.hints.showActivationIndicatorColor;
    applyActivationIndicatorColor();
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

  const nextFastConfig = changes.fastConfig.newValue as {
    rules?: {
      urls?: FastRule[];
    };
    hotkeys?: {
      mappings?: Partial<Record<string, ActionName>>;
      prefixes?: Partial<Record<string, true>>;
    };
    hints?: {
      css?: string;
      charset?: string;
      avoidAdjacentPairs?: Partial<Record<string, Partial<Record<string, true>>>>;
      preferredSearchLabels?: string[];
      showCapitalizedLetters?: boolean;
      showActivationIndicator?: boolean;
      showActivationIndicatorColor?: string;
    };
  };

  if (nextFastConfig.rules?.urls) {
    applyUrlRules(nextFastConfig.rules.urls);
  }

  if (nextFastConfig.hints?.charset) {
    setHintCharset(nextFastConfig.hints.charset);
  }

  if (nextFastConfig.hints?.avoidAdjacentPairs) {
    setAvoidedAdjacentHintPairs(nextFastConfig.hints.avoidAdjacentPairs);
  }

  if (nextFastConfig.hints?.preferredSearchLabels) {
    setPreferredSearchLabels(nextFastConfig.hints.preferredSearchLabels);
  }

  if (typeof nextFastConfig.hints?.showCapitalizedLetters === "boolean") {
    setShowCapitalizedLetters(nextFastConfig.hints.showCapitalizedLetters);
  }

  if (typeof nextFastConfig.hints?.css === "string") {
    setHintCSS(nextFastConfig.hints.css);
  }

  if (typeof nextFastConfig.hints?.showActivationIndicator === "boolean") {
    showActivationIndicator = nextFastConfig.hints.showActivationIndicator;
  }

  if (typeof nextFastConfig.hints?.showActivationIndicatorColor === "string") {
    activationIndicatorColor = nextFastConfig.hints.showActivationIndicatorColor;
    applyActivationIndicatorColor();
  }

  if (nextFastConfig.hotkeys?.mappings && nextFastConfig.hotkeys.prefixes) {
    applyHotkeyMappings(nextFastConfig.hotkeys.mappings, nextFastConfig.hotkeys.prefixes);
  }
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

  if (!didHandle) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
};

const ensureFocusStyles = (): void => {
  if (document.getElementById(FOCUS_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = FOCUS_STYLE_ID;
  style.textContent = `
    @keyframes nav-focus-pulse {
      0% {
        opacity: 1;
        box-shadow:
          0 0 0 10px var(--nav-focus-ring-outer-strong, rgba(234, 179, 8, 0.38)),
          0 0 0 6px var(--nav-focus-ring-inner-strong, rgba(234, 179, 8, 0.95));
      }

      18% {
        opacity: 1;
        box-shadow:
          0 0 0 5px var(--nav-focus-ring-outer-medium, rgba(234, 179, 8, 0.18)),
          0 0 0 3px var(--nav-focus-ring-inner-medium, rgba(234, 179, 8, 0.95));
      }

      70% {
        opacity: 1;
        box-shadow:
          0 0 0 2px var(--nav-focus-ring-outer-soft, rgba(234, 179, 8, 0.06)),
          0 0 0 2px var(--nav-focus-ring-inner-soft, rgba(234, 179, 8, 0.92));
      }

      100% {
        opacity: 0;
        box-shadow:
          0 0 0 2px var(--nav-focus-ring-outer-fade, rgba(234, 179, 8, 0.02)),
          0 0 0 2px var(--nav-focus-ring-inner-fade, rgba(234, 179, 8, 0));
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

  const styleRoot = document.head ?? document.documentElement;
  styleRoot.append(style);
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
  applyActivationIndicatorColor(overlay);
  document.documentElement.append(overlay);
  return overlay;
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
  overlay.style.boxShadow = "0 0 0 2px var(--nav-focus-ring-static, rgba(234, 179, 8, 0.95))";
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
    window.addEventListener(FOCUS_INDICATOR_EVENT, handleFocusIndicator as EventListener, true);
    window.addEventListener("beforeinput", handleEditableBeforeInput, true);
    window.addEventListener("compositionstart", handleEditableBeforeInput, true);
    window.addEventListener("resize", scheduleFocusOverlayPosition, true);
    window.addEventListener("scroll", scheduleFocusOverlayPosition, true);
  }
  ensureToastWrapper();
  syncFastConfig();

  chrome.storage.onChanged.addListener(handleStorageChange);
  window.addEventListener("keydown", handleKeydown, true);
};
