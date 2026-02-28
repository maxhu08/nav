import {
  installScrollTracking,
  scrollDown,
  scrollToBottom,
  scrollToTop,
  scrollUp
} from "~/src/actions/scroll";
import { isEditableTarget } from "~/src/utils/isEditableTarget";

type ActionName = "scroll-down" | "scroll-up" | "scroll-to-bottom" | "scroll-to-top";

type ActionHandler = () => boolean;

const KEY_ACTIONS: Partial<Record<string, ActionName>> = {
  j: "scroll-down",
  k: "scroll-up",
  gg: "scroll-to-top",
  G: "scroll-to-bottom"
};

const ACTIONS: Record<ActionName, ActionHandler> = {
  "scroll-down": scrollDown,
  "scroll-up": scrollUp,
  "scroll-to-bottom": scrollToBottom,
  "scroll-to-top": scrollToTop
};

const KEY_SEQUENCE_TIMEOUT_MS = 1000;

let pendingSequence = "";
let pendingSequenceTimer: number | null = null;

function clearPendingSequence(): void {
  pendingSequence = "";

  if (pendingSequenceTimer !== null) {
    window.clearTimeout(pendingSequenceTimer);
    pendingSequenceTimer = null;
  }
}

function startPendingSequence(sequence: string): void {
  clearPendingSequence();
  pendingSequence = sequence;
  pendingSequenceTimer = window.setTimeout(() => {
    clearPendingSequence();
  }, KEY_SEQUENCE_TIMEOUT_MS);
}

function getActionName(key: string): ActionName | null {
  const nextSequence = `${pendingSequence}${key}`;
  const directMatch = KEY_ACTIONS[nextSequence];

  if (directMatch) {
    clearPendingSequence();
    return directMatch;
  }

  const hasLongerMatch = Object.keys(KEY_ACTIONS).some((sequence) => sequence.startsWith(nextSequence));

  if (hasLongerMatch) {
    startPendingSequence(nextSequence);
    return null;
  }

  clearPendingSequence();
  return KEY_ACTIONS[key] ?? null;
}

installScrollTracking();

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isEditableTarget(event.target)
    ) {
      clearPendingSequence();
      return;
    }

    const actionName = getActionName(event.key);

    if (!actionName) {
      return;
    }

    const didHandle = ACTIONS[actionName]();

    if (!didHandle) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  },
  true
);
