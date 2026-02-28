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
import { isEditableTarget } from "~/src/core/utils/isEditableTarget";
import { getToastApi } from "~/src/core/utils/sonner";

type ActionName =
  | "show-hints-current-tab"
  | "show-hints-new-tab"
  | "yank-current-tab-url"
  | "scroll-down"
  | "scroll-half-page-down"
  | "scroll-half-page-up"
  | "scroll-left"
  | "scroll-right"
  | "scroll-up"
  | "scroll-to-bottom"
  | "scroll-to-top";

type ActionHandler = (count?: number) => boolean;

const KEY_ACTIONS: Partial<Record<string, ActionName>> = {
  d: "scroll-half-page-down",
  f: "show-hints-current-tab",
  h: "scroll-left",
  j: "scroll-down",
  k: "scroll-up",
  l: "scroll-right",
  u: "scroll-half-page-up",
  F: "show-hints-new-tab",
  yy: "yank-current-tab-url",
  gg: "scroll-to-top",
  G: "scroll-to-bottom"
};

async function writeClipboard(text: string): Promise<boolean> {
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
}

function getNormalizedCurrentUrl(): string {
  const url = new URL(window.location.href);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");

  return `${url.origin}${pathname}${url.search}${url.hash}`;
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const sideLength = Math.max(1, Math.floor((maxLength - 1) / 2));
  return `${value.slice(0, sideLength)}…${value.slice(-sideLength)}`;
}

function yankCurrentTabUrl(): boolean {
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
}

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

function blurActiveEditableTarget(): boolean {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof HTMLElement) || !isEditableTarget(activeElement)) {
    return false;
  }

  activeElement.blur();
  return true;
}

function clearPendingSequence(): void {
  pendingSequence = "";

  if (pendingSequenceTimer !== null) {
    window.clearTimeout(pendingSequenceTimer);
    pendingSequenceTimer = null;
  }
}

function clearPendingCount(): void {
  pendingCount = "";
}

function clearPendingState(): void {
  clearPendingSequence();
  clearPendingCount();
}

function startPendingSequence(sequence: string): void {
  clearPendingSequence();
  pendingSequence = sequence;
  pendingSequenceTimer = window.setTimeout(() => {
    clearPendingSequence();
  }, KEY_SEQUENCE_TIMEOUT_MS);
}

function isCountKey(key: string): boolean {
  if (pendingCount) {
    return key >= "0" && key <= "9";
  }

  return key >= "1" && key <= "9";
}

function consumeCountKey(key: string): void {
  pendingCount = pendingSequence ? key : `${pendingCount}${key}`;
  clearPendingSequence();
}

function resolveCount(): number {
  const count = pendingCount ? Number.parseInt(pendingCount, 10) : 1;
  clearPendingCount();
  return count;
}

function getActionName(key: string): KeyParseResult {
  if (isCountKey(key)) {
    consumeCountKey(key);
    return { actionName: null, consumed: true };
  }

  const nextSequence = `${pendingSequence}${key}`;
  const directMatch = KEY_ACTIONS[nextSequence];

  if (directMatch) {
    clearPendingSequence();
    return { actionName: directMatch, consumed: true };
  }

  const hasLongerMatch = Object.keys(KEY_ACTIONS).some((sequence) =>
    sequence.startsWith(nextSequence)
  );

  if (hasLongerMatch) {
    startPendingSequence(nextSequence);
    return { actionName: null, consumed: true };
  }

  clearPendingSequence();
  const actionName = KEY_ACTIONS[key] ?? null;

  if (!actionName) {
    clearPendingCount();
    return { actionName: null, consumed: false };
  }

  return { actionName, consumed: true };
}

installScrollTracking();

document.addEventListener(
  "keydown",
  (event) => {
    if (areHintsActive()) {
      if (handleHintsKeydown(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.key === "Escape" && blurActiveEditableTarget()) {
      clearPendingState();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isEditableTarget(event.target)
    ) {
      clearPendingState();
      return;
    }

    const { actionName, consumed } = getActionName(event.key);

    if (!actionName) {
      if (consumed) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    const didHandle = ACTIONS[actionName](resolveCount());

    if (!didHandle) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  },
  true
);
