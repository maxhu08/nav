import { activateHints, areHintsActive, handleHintsKeydown } from "~/src/core/actions/hints";
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
import { getToastApi } from "~/src/core/utils/sonner";
import { type FastRule, getFastConfig } from "~/src/utils/fast-config";
import { type ActionName } from "~/src/utils/hotkeys";

type ActionHandler = (count?: number) => boolean;

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

const truncateMiddle = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  const sideLength = Math.max(1, Math.floor((maxLength - 1) / 2));
  return `${value.slice(0, sideLength)}…${value.slice(-sideLength)}`;
};

const yankCurrentTabUrl = (): boolean => {
  const currentUrl = getNormalizedCurrentUrl();

  void writeClipboard(currentUrl).then((didCopy) => {
    const toast = getToastApi();

    if (didCopy) {
      toast?.success("Current tab URL yanked", {
        description: truncateMiddle(currentUrl, 72)
      });
      return;
    }

    toast?.error("Could not yank current tab URL", {
      description: "Clipboard access was denied."
    });
  });

  return true;
};

const ACTIONS: Record<ActionName, ActionHandler> = {
  "show-hints-current-tab": () => activateHints("current-tab"),
  "show-hints-new-tab": () => activateHints("new-tab"),
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

type KeyParseResult = {
  actionName: ActionName | null;
  consumed: boolean;
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

installScrollTracking();

void getFastConfig().then((fastConfig) => {
  applyUrlRules(fastConfig.rules.urls);
  applyHotkeyMappings(fastConfig.hotkeys.mappings, fastConfig.hotkeys.prefixes);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.fastConfig?.newValue) {
    return;
  }

  const nextHotkeys = changes.fastConfig.newValue as {
    rules?: {
      urls?: FastRule[];
    };
    hotkeys?: {
      mappings?: Partial<Record<string, ActionName>>;
      prefixes?: Partial<Record<string, true>>;
    };
  };

  if (nextHotkeys.rules?.urls) {
    applyUrlRules(nextHotkeys.rules.urls);
  }

  if (nextHotkeys.hotkeys?.mappings && nextHotkeys.hotkeys.prefixes) {
    applyHotkeyMappings(nextHotkeys.hotkeys.mappings, nextHotkeys.hotkeys.prefixes);
  }
});

window.addEventListener(
  "keydown",
  (event) => {
    if (areHintsActive()) {
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
  },
  true
);
