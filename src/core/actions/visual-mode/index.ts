import { scrollDown, scrollUp } from "~/src/core/actions/scroll";
import type { createFindModeController } from "~/src/core/actions/find-mode";
import { createVisualSelection, type SelectionSnapshot } from "./selection";
import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/is-editable-target";
import {
  activateSiteKeybindIgnore,
  deactivateSiteKeybindIgnore
} from "~/src/core/utils/ignore-site-keybinds";
import { writeClipboardText } from "~/src/core/utils/hint-mode/actions/write-clipboard-text";
import { getToastApi } from "~/src/core/utils/sonner";
import type { CoreMode, VisualMode, ActionHandler } from "~/src/core/navigation/shared";
import type { VisualActionName } from "~/src/utils/hotkeys";

export type VisualActions = Record<
  VisualActionName | "visual-mode" | "visual-line-mode" | "visual-restore",
  ActionHandler
>;

type VisualDeps = {
  getMode: () => CoreMode;
  setMode: (mode: CoreMode) => void;
  clearPendingState: () => void;
  findMode: Pick<
    ReturnType<typeof createFindModeController>,
    | "getCurrentFindRange"
    | "suspendForVisual"
    | "openVisualFind"
    | "cycleFindMatch"
    | "navigateText"
  >;
};

export const createVisualModeController = (deps: VisualDeps) => {
  const selection = createVisualSelection();
  let retain = false;
  let editable: { target: HTMLElement; selection: SelectionSnapshot; url: string } | null = null;
  let saved: { selection: SelectionSnapshot; mode: VisualMode; url: string } | null = null;
  const isActive = (): boolean => ["caret", "visual", "visual-line"].includes(deps.getMode());
  const error = (message: string): void => {
    getToastApi()?.error(message);
  };
  const notify = (mode: VisualMode | "normal"): void => {
    const labels = {
      caret: "Caret mode",
      visual: "Visual mode",
      "visual-line": "Visual mode (line)",
      normal: "Normal mode"
    };
    getToastApi()?.info(labels[mode], { duration: 1000 });
  };
  const forgetEditable = (): void => {
    editable = null;
    document.removeEventListener("pointerdown", forgetEditable, true);
    document.removeEventListener("focusin", forgetEditable, true);
    window.removeEventListener("pagehide", forgetEditable);
  };
  const rememberEditableTarget = (target: HTMLElement): void => {
    forgetEditable();
    const snapshot = selection.snapshot();
    if (!snapshot) return;
    editable = { target, selection: snapshot, url: window.location.href };
    document.addEventListener("pointerdown", forgetEditable, true);
    document.addEventListener("focusin", forgetEditable, true);
    window.addEventListener("pagehide", forgetEditable);
  };
  const resumeEditable = (): void => {
    const previous = editable;
    forgetEditable();
    if (!previous || previous.url !== window.location.href || !previous.target.isConnected) return;
    const visible = Array.from(previous.target.getClientRects()).some(
      (rect) =>
        rect.bottom >= 0 &&
        rect.top < window.innerHeight &&
        rect.right >= 0 &&
        rect.left < window.innerWidth
    );
    if (visible) selection.restore(previous.selection);
  };
  const remember = (): void => {
    const snapshot = selection.snapshot();
    if (snapshot && isActive() && deps.getMode() !== "caret") {
      saved = {
        selection: snapshot,
        mode: deps.getMode() as VisualMode,
        url: window.location.href
      };
    }
  };
  const stop = (): void => {
    document.removeEventListener("click", handleClick, true);
    window.removeEventListener("pagehide", handlePageHide);
    deactivateSiteKeybindIgnore("visual");
    deps.clearPendingState();
  };
  const leave = (escape = false, click = false): boolean => {
    if (!isActive()) return false;
    remember();
    if (!retain) selection.collapse(escape && deps.getMode() !== "caret" ? "focus" : "anchor");
    stop();
    deps.setMode("normal");
    const active = getDeepActiveElement();
    if (!click && active instanceof HTMLElement && isEditableTarget(active)) {
      rememberEditableTarget(active);
      active.blur();
    }
    return true;
  };
  const exit = (escape = false, click = false): void => {
    if (leave(escape, click)) notify("normal");
  };
  const handleClick = (event: MouseEvent): void => {
    if (
      event
        .composedPath()
        .some(
          (target) =>
            target instanceof Element &&
            target.matches(
              "a[href], button, input, textarea, select, [tabindex], [contenteditable]"
            )
        )
    )
      exit(false, true);
  };
  const handlePageHide = (): void => {
    exit();
    saved = null;
    forgetEditable();
  };
  const activate = (mode: VisualMode): void => {
    const changed = deps.getMode() !== mode;
    deps.clearPendingState();
    deps.setMode(mode);
    if (mode === "visual-line") selection.linewise();
    activateSiteKeybindIgnore("visual");
    document.addEventListener("click", handleClick, true);
    window.addEventListener("pagehide", handlePageHide);
    if (changed) notify(mode);
    selection.scrollIntoView();
  };
  const enter = (mode: "visual" | "visual-line"): boolean => {
    if (!selection.supported()) {
      error("Native text selection is unavailable on this page.");
      return true;
    }
    if (isActive()) {
      if (deps.getMode() === "caret") selection.collapse("anchor");
      selection.ensureCharacter();
      activate(mode);
      return true;
    }
    const match = deps.getMode() === "find" ? deps.findMode.getCurrentFindRange() : null;
    if (deps.getMode() === "find") deps.findMode.suspendForVisual();
    else resumeEditable();
    if (match) selection.setRange(match);
    retain = selection.hasRange() && !selection.isCollapsed();
    if (selection.visible()) {
      selection.ensureCharacter();
      activate(mode);
      return true;
    }
    if (!selection.establish()) {
      error("Create a selection before entering visual mode.");
      return true;
    }
    retain = false;
    selection.showCaret();
    activate("caret");
    return true;
  };
  const command =
    (run: (count: number, method: "move" | "extend") => void): ActionHandler =>
    (count = 1) => {
      if (!selection.hasRange()) {
        exit();
        return true;
      }
      const caret = deps.getMode() === "caret";
      if (caret) selection.collapse("anchor");
      run(count, caret ? "move" : "extend");
      if (deps.getMode() === "visual-line") selection.linewise();
      if (caret && isActive()) selection.showCaret();
      selection.scrollIntoView();
      return true;
    };
  const movement = (direction: "forward" | "backward", granularity: string): ActionHandler =>
    command((count, method) => {
      for (let index = 0; index < count; index++) {
        const before = deps.getMode() === "visual-line" ? selection.snapshot() : null;
        selection.move(method, direction, granularity);
        if (before && selection.isCollapsed()) {
          selection.restore(before);
          selection.reverse();
          selection.move(method, direction, granularity);
        }
      }
    });
  const yank = (target?: "current-tab" | "new-tab"): boolean => {
    const text = selection.text();
    if (!text) {
      error("No text selected.");
      return true;
    }
    const snapshot = selection.snapshot();
    leave();
    const current = window.getSelection();
    const after = {
      node: current?.focusNode,
      offset: current?.focusOffset,
      active: getDeepActiveElement()
    };
    void writeClipboardText(text.replaceAll("\u00a0", " ")).then((success) => {
      const mode = deps.getMode() === "normal" ? "Normal mode, " : "";
      if (success)
        getToastApi()?.success(
          `${mode}Yanked ${text.length} character${text.length === 1 ? "" : "s"}.`,
          { duration: 1000 }
        );
      else {
        if (
          snapshot &&
          deps.getMode() === "normal" &&
          getDeepActiveElement() === after.active &&
          window.getSelection()?.focusNode === after.node &&
          window.getSelection()?.focusOffset === after.offset
        )
          selection.restore(snapshot);
        error(`${mode}Could not copy selected text. Clipboard access was denied.`);
      }
    });
    // Open synchronously while the browser's user activation is still available.
    if (target) deps.findMode.navigateText(text, target);
    return true;
  };
  const find =
    (direction: 1 | -1): ActionHandler =>
    (count = 1) => {
      for (let index = 0; index < count; index++) {
        if (!deps.findMode.cycleFindMatch(direction)) {
          error("No query or matches to find.");
          return true;
        }
      }
      const range = deps.findMode.getCurrentFindRange();
      if (range) {
        selection.setRange(range);
        activate(deps.getMode() === "caret" ? "visual" : (deps.getMode() as VisualMode));
      }
      return true;
    };
  const actions: VisualActions = {
    "visual-mode": () => enter("visual"),
    "visual-line-mode": () => enter("visual-line"),
    "visual-restore": () => {
      if (!saved || saved.url !== window.location.href || !selection.restore(saved.selection)) {
        error("The previous visual selection is no longer available.");
        return true;
      }
      if (deps.getMode() === "find") deps.findMode.suspendForVisual();
      retain = false;
      activate(saved.mode);
      return true;
    },
    "visual-left": movement("backward", "character"),
    "visual-right": movement("forward", "character"),
    "visual-down": movement("forward", "line"),
    "visual-up": movement("backward", "line"),
    "visual-word-forward": movement("forward", "vimword"),
    "visual-word-backward": movement("backward", "word"),
    "visual-word-end": movement("forward", "word"),
    "visual-sentence-forward": movement("forward", "sentence"),
    "visual-sentence-backward": movement("backward", "sentence"),
    "visual-paragraph-forward": movement("forward", "paragraph"),
    "visual-paragraph-backward": movement("backward", "paragraph"),
    "visual-line-start": movement("backward", "lineboundary"),
    "visual-line-end": movement("forward", "lineboundary"),
    "visual-document-start": movement("backward", "documentboundary"),
    "visual-document-end": movement("forward", "documentboundary"),
    "visual-select-word": command((count) => selection.selectEntity("word", count)),
    "visual-select-inner-word": command((count) => selection.selectEntity("word", count, true)),
    "visual-select-sentence": command((count) => selection.selectEntity("sentence", count)),
    "visual-reverse": command(() => selection.reverse()),
    "visual-character": () => enter("visual"),
    "visual-line": () => enter("visual-line"),
    "visual-caret": () => {
      selection.collapse(
        deps.getMode() === "caret" || selection.text().length <= 1 ? "anchor" : "focus"
      );
      selection.showCaret();
      retain = false;
      activate("caret");
      return true;
    },
    "visual-yank": () => yank(),
    "visual-yank-line": (count = 1) => {
      selection.selectLine(count);
      return yank();
    },
    "visual-open-current-tab": () => yank("current-tab"),
    "visual-open-new-tab": () => yank("new-tab"),
    "visual-find-next": find(1),
    "visual-find-prev": find(-1),
    "visual-find": () => {
      const snapshot = selection.snapshot();
      remember();
      stop();
      if (
        !deps.findMode.openVisualFind((range) => {
          if (range) selection.setRange(range);
          else if (snapshot) selection.restore(snapshot);
          enter("visual");
          retain = false;
        })
      )
        activate("visual");
      return true;
    },
    "visual-scroll-down": (count) => {
      scrollDown(count);
      return true;
    },
    "visual-scroll-up": (count) => {
      scrollUp(count);
      return true;
    }
  };
  return { actions, isActive, exit, rememberEditableTarget };
};