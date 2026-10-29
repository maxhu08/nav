import { createVisualSelection } from "~/src/core/actions/visual-mode/selection";
import { createVisualModeController } from "~/src/core/actions/visual-mode";
import { createFindModeController } from "~/src/core/actions/find-mode";
import { createModeController } from "~/src/core/navigation/shared";
import { resetSiteKeybindIgnoreForTests } from "~/src/core/utils/ignore-site-keybinds";
import { getFindInput } from "~/src/core/utils/get-ui";
import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";
import { createNavigationKeydownHandler } from "~/src/core/navigation/keydown";
import { createNavigationActions } from "~/src/core/navigation/actions";
import { createKeyboardPriorityController } from "~/src/core/navigation/keyboard-priority";
import { createKeyState } from "~/src/core/utils/key-state";
import { createHintController } from "~/src/core/actions/hint-mode";
import { createWatchController } from "~/src/core/actions/watch-mode";
import { DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/config-defaults";
import { parseHotkeyMappingsValue } from "~/src/utils/hotkeys";

const passed: string[] = [];
const failed: string[] = [];
const copied: string[] = [];
Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: {
    writeText: async (text: string) => {
      copied.push(text);
    }
  }
});
const equal = (actual: unknown, expected: unknown): void => {
  if (actual !== expected)
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const check = (value: unknown): void => {
  if (!value) throw new Error("Assertion failed");
};
const run = (name: string, test: () => void): void => {
  try {
    test();
    passed.push(name);
  } catch (error) {
    failed.push(`${name}: ${String(error)}`);
  } finally {
    resetSiteKeybindIgnoreForTests();
  }
};
const fixture = (
  html = '<p id="text">alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu.</p>'
) => {
  copied.length = 0;
  document.body.innerHTML = html;
  document.querySelectorAll("[data-nav-overlay-root]").forEach((node) => node.remove());
  ensureToastWrapper();
  window.getSelection()!.removeAllRanges();
  window.scrollTo(0, 0);
  const mode = createModeController();
  const find = createFindModeController({
    getMode: mode.getMode,
    setMode: mode.setMode,
    onFocusIndicator: () => {},
    injectFindUIStyles: () => {}
  });
  const destinations: Array<{ text: string; target: string }> = [];
  const visual = createVisualModeController({
    getMode: mode.getMode,
    setMode: mode.setMode,
    clearPendingState: () => {},
    findMode: {
      ...find,
      navigateText: (text, target) => {
        destinations.push({ text, target });
        return true;
      }
    }
  });
  const selection = createVisualSelection();
  const select = (start: number, end = start, id = "text"): void => {
    const node = document.getElementById(id)!.firstChild!;
    window.getSelection()!.collapse(node, start);
    window.getSelection()!.extend(node, end);
  };
  return { mode, find, visual, selection, select, destinations };
};

run("caret entry, word movement, visual extension, Escape and gv", () => {
  const f = fixture();
  f.visual.actions["visual-mode"]();
  equal(f.mode.getMode(), "caret");
  equal(f.selection.text(), "a");
  f.visual.actions["visual-word-forward"]();
  equal(f.selection.text(), "b");
  f.visual.actions["visual-character"]();
  equal(f.mode.getMode(), "visual");
  f.visual.actions["visual-word-end"](2);
  equal(f.selection.text(), "beta gamma");
  f.visual.exit(true);
  equal(f.selection.text(), "");
  equal(window.getSelection()!.focusOffset, 16);
  f.visual.actions["visual-restore"]();
  equal(f.selection.text(), "beta gamma");
  equal(f.mode.getMode(), "visual");
  f.visual.exit();
});
run("existing backward selection is retained and o swaps endpoints", () => {
  const f = fixture();
  f.select(10, 6);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-reverse"]();
  equal(window.getSelection()!.anchorOffset, 6);
  equal(window.getSelection()!.focusOffset, 10);
  f.visual.exit(true);
  equal(f.selection.text(), "beta");
});
run("iw and counted iw omit outer whitespace", () => {
  const f = fixture();
  f.select(2, 3);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-select-inner-word"]();
  equal(f.selection.text(), "alpha");
  f.visual.actions["visual-select-inner-word"](2);
  equal(f.selection.text(), "alpha beta");
  f.visual.exit();
});
run("aw selects whole words with a count", () => {
  const f = fixture();
  f.select(1, 2);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-select-word"](2);
  equal(f.selection.text(), "alpha beta");
  f.visual.exit();
});
run("short-text fallback excludes hidden and editable text", () => {
  const f = fixture(
    '<p style="display:none">hidden text</p><div contenteditable="true">editor text</div><p id="text">short page</p>'
  );
  f.visual.actions["visual-mode"]();
  equal(f.mode.getMode(), "caret");
  equal(f.selection.text(), "s");
  f.visual.exit();
});
run("substantial visible text is preferred to short navigation", () => {
  const f = fixture(
    '<p>menu</p><p id="text">alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu.</p>'
  );
  f.visual.actions["visual-mode"]();
  equal(f.selection.text(), "a");
  f.visual.exit();
});
run("linewise selection grows and reverses across preformatted lines", () => {
  const f = fixture('<pre id="text">alpha beta\ngamma delta\nepsilon zeta</pre>');
  f.select(1, 2);
  f.visual.actions["visual-line-mode"]();
  equal(f.selection.text(), "alpha beta");
  f.visual.actions["visual-down"]();
  check(f.selection.text().includes("gamma delta"));
  f.visual.actions["visual-up"]();
  equal(f.selection.text(), "alpha beta");
  f.visual.actions["visual-down"]();
  check(f.selection.text().includes("gamma delta"));
  f.visual.exit();
});
run("wrapped lines use rendered boundaries", () => {
  const f = fixture(
    '<p id="text" style="width:100px;font:16px monospace">alpha beta gamma delta epsilon zeta</p>'
  );
  f.select(1, 2);
  f.visual.actions["visual-line-mode"]();
  check(f.selection.text().length < document.getElementById("text")!.textContent!.length);
  f.visual.actions["visual-down"]();
  check(f.selection.text().includes("gamma"));
  f.visual.exit();
});
run("sentence, paragraph and document movement work in both browsers", () => {
  const f = fixture(
    '<p id="text">First sentence. Second sentence.</p><p id="last">Next paragraph.</p>'
  );
  f.select(0, 1);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-sentence-forward"]();
  check(f.selection.text().includes("First sentence."));
  f.visual.actions["visual-paragraph-forward"]();
  check(window.getSelection()!.focusNode!.parentElement!.id === "last");
  f.visual.actions["visual-document-end"]();
  check(f.selection.text().endsWith("Next paragraph."));
  f.visual.actions["visual-document-start"]();
  equal(window.getSelection()!.focusNode!.parentElement!.id, "text");
  f.visual.exit();
});
run("find match handoff, n/N, visual find commit and cancel", () => {
  const f = fixture('<p id="text">alpha beta alpha gamma alpha</p>');
  f.find.openFindPrompt();
  getFindInput()!.value = "alpha";
  f.find.handleFindUIKeydown(new KeyboardEvent("keydown", { key: "Enter" }));
  f.visual.actions["visual-mode"]();
  equal(f.selection.text(), "alpha");
  f.visual.actions["visual-find-next"](2);
  equal(window.getSelection()!.anchorOffset, 23);
  f.visual.actions["visual-find-prev"]();
  equal(window.getSelection()!.anchorOffset, 11);
  f.visual.actions["visual-find"]();
  equal(f.mode.getMode(), "find");
  getFindInput()!.value = "beta";
  f.find.handleFindUIKeydown(new KeyboardEvent("keydown", { key: "Enter" }));
  equal(f.mode.getMode(), "visual");
  equal(f.selection.text(), "beta");
  f.visual.actions["visual-find"]();
  getFindInput()!.value = "missing";
  f.find.exitFindMode();
  equal(f.mode.getMode(), "visual");
  equal(f.selection.text(), "beta");
  equal(f.find.getFindQuery(), "beta");
  f.visual.exit();
});
run("gv refuses modified and detached endpoints", () => {
  const f = fixture();
  f.select(0, 5);
  f.visual.actions["visual-mode"]();
  f.visual.exit();
  document.getElementById("text")!.firstChild!.textContent = "replacement";
  f.visual.actions["visual-restore"]();
  equal(f.mode.getMode(), "normal");
  document.getElementById("text")!.remove();
  f.visual.actions["visual-restore"]();
  equal(f.mode.getMode(), "normal");
});
run("movement traverses inline nodes and scrolls nested containers", () => {
  const f = fixture(
    '<div style="height:40px;overflow:auto"><p id="text">alpha <span>beta</span> gamma</p><p style="margin-top:200px" id="last">last text</p></div>'
  );
  f.select(0, 1);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-word-end"](2);
  equal(f.selection.text(), "alpha beta");
  f.visual.actions["visual-document-end"]();
  check(document.getElementById("text")!.parentElement!.scrollTop > 0);
  f.visual.exit();
});
run("contenteditable movement and focusable click exit", () => {
  const f = fixture(
    '<div id="text" contenteditable="true">alpha beta gamma</div><input id="input">'
  );
  f.select(0, 1);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-word-end"]();
  equal(f.selection.text(), "alpha");
  f.visual.exit();
  f.select(0, 1);
  f.visual.actions["visual-mode"]();
  document.getElementById("input")!.click();
  equal(f.mode.getMode(), "normal");
});

run("document-end movement keeps the focus visible inside a tall text element", () => {
  const f = fixture(
    `<pre id="text">${Array.from({ length: 100 }, (_, index) => `line ${index}`).join("\n")}</pre>`
  );
  f.select(0, 1);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-document-end"]();
  const range = window.getSelection()!.getRangeAt(0).cloneRange();
  range.collapse(false);
  check(range.getBoundingClientRect().bottom <= window.innerHeight);
  f.visual.exit();
});
run("Y includes a newline and respects a line count", () => {
  const f = fixture('<pre id="text">alpha beta\ngamma delta\nepsilon zeta</pre>');
  f.select(1, 2);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-yank-line"](2);
  equal(copied[0], "alpha beta\ngamma delta\n");
  equal(f.mode.getMode(), "normal");
});
run("p/P copy and navigate the selection synchronously", () => {
  const f = fixture();
  f.select(0, 5);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-open-new-tab"]();
  equal(copied[0], "alpha");
  equal(f.destinations[0]?.target, "new-tab");
  equal(f.destinations[0]?.text, "alpha");
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-open-current-tab"]();
  equal(f.destinations[1]?.target, "current-tab");
  equal(f.mode.getMode(), "normal");
});
run("dismissing a visual-origin find prompt returns to selection mode", () => {
  const f = fixture();
  f.select(0, 5);
  f.visual.actions["visual-mode"]();
  f.visual.actions["visual-find"]();
  f.find.hideFindBar();
  equal(f.mode.getMode(), "visual");
  equal(f.selection.text(), "alpha");
  f.visual.exit();
});
run("native input selection restores saved offsets and direction", () => {
  const f = fixture('<p id="text">page text</p><textarea id="input">alpha beta</textarea>');
  f.select(0, 1);
  const input = document.getElementById("input") as HTMLTextAreaElement;
  input.focus();
  input.setSelectionRange(0, 5, "forward");
  f.selection.reverse();
  equal(input.selectionDirection, "backward");
  const saved = f.selection.snapshot()!;
  input.setSelectionRange(6, 10);
  check(f.selection.restore(saved));
  equal(input.selectionStart, 0);
  equal(input.selectionEnd, 5);
  equal(input.selectionDirection, "backward");
});
run("automatic visual exits return to normal mode without a toast", () => {
  for (const cause of ["programmatic", "click", "pagehide"]) {
    const f = fixture('<p id="text">alpha beta</p><button id="button">Focus</button>');
    f.select(0, 1);
    f.visual.actions["visual-mode"]();
    const count = document.querySelectorAll("[data-sonner-toaster] > li").length;
    if (cause === "click") document.getElementById("button")!.click();
    else if (cause === "pagehide") window.dispatchEvent(new Event("pagehide"));
    else f.visual.exit();
    equal(f.mode.getMode(), "normal");
    equal(document.querySelectorAll("[data-sonner-toaster] > li").length, count);
  }
});

const runtime = (f: ReturnType<typeof fixture>, bindings = DEFAULT_HOTKEY_MAPPINGS) => {
  const keys = createKeyState({ getMode: f.mode.getMode });
  const mappings = parseHotkeyMappingsValue(bindings).mappings;
  keys.applyHotkeyMappings(
    mappings,
    Object.fromEntries(
      Object.keys(mappings).flatMap((key) =>
        Array.from({ length: key.length - 1 }, (_, index) => [key.slice(0, index + 1), true])
      )
    )
  );
  const hints = createHintController({ setMode: f.mode.setMode });
  const watch = createWatchController({
    isWatchMode: () => f.mode.isMode("watch"),
    setMode: f.mode.setMode,
    getActionSequence: keys.getActionSequence
  });
  const actions = createNavigationActions({
    visualController: f.visual,
    findMode: f.find,
    hintController: hints,
    watchController: watch
  });
  const priority = createKeyboardPriorityController();
  const handler = createNavigationKeydownHandler({
    actions: actions.actions,
    findMode: f.find,
    hintController: hints,
    watchController: watch,
    visualController: f.visual,
    onExitTyping: (target) => {
      f.visual.rememberEditableTarget(target);
      f.mode.setMode("normal");
    },
    forceNormalMode: { isEnabled: () => false, handleKeydownCapture: () => {} },
    keyState: keys,
    isScrollAction: actions.isScrollAction,
    onConsumeKeydown: priority.handleConsumedKeydown
  });
  priority.install();
  window.addEventListener("keydown", handler, true);
  return {
    close: () => {
      f.visual.exit();
      window.removeEventListener("keydown", handler, true);
      priority.uninstall();
      resetSiteKeybindIgnoreForTests();
    }
  };
};
const press = async (key: string, options: KeyboardEventInit = {}): Promise<void> => {
  if (document.documentElement.dataset.browser === "chromium") {
    const response = await fetch("/keys", {
      method: "POST",
      body: JSON.stringify([{ key, ...options }])
    });
    if (!response.ok) throw new Error(await response.text());
    return;
  }
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    composed: true,
    ...options
  });
  const target = document.activeElement!;
  target.dispatchEvent(event);
  if (!event.defaultPrevented && key.length === 1 && !options.metaKey && !options.ctrlKey)
    document.execCommand("insertText", false, key);
  target.dispatchEvent(
    new KeyboardEvent("keyup", { key, bubbles: true, composed: true, ...options })
  );
};
const runAsync = async (name: string, test: () => Promise<void>): Promise<void> => {
  try {
    await test();
    passed.push(name);
  } catch (error) {
    failed.push(`${name}: ${String(error)}`);
  }
};

await runAsync("Escape and Ctrl-[ notify once when exiting visual or caret mode", async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  for (const mode of ["caret", "visual", "visual-line"]) {
    for (const key of ["Escape", "["]) {
      const f = fixture();
      const r = runtime(f);
      try {
        if (mode !== "caret") f.select(0, 1);
        f.visual.actions[mode === "visual-line" ? "visual-line-mode" : "visual-mode"]();
        equal(f.mode.getMode(), mode);
        const count = document.querySelectorAll("[data-sonner-toaster] > li").length;
        await press(key, { ctrlKey: key === "[" });
        equal(f.mode.getMode(), "normal");
        equal(document.querySelectorAll("[data-sonner-toaster] > li").length, count + 1);
        check(
          document.querySelector("[data-sonner-toaster] > li")?.textContent?.includes("Normal mode")
        );
        await press(key, { ctrlKey: key === "[" });
        equal(document.querySelectorAll("[data-sonner-toaster] > li").length, count + 1);
      } finally {
        r.close();
      }
    }
  }
});

await runAsync(
  "Escape and Ctrl-[ then v resume native input/textarea selection through keyboard routing",
  async () => {
    for (const key of ["Escape", "["]) {
      for (const tag of ["input", "textarea"]) {
        const f = fixture(
          tag === "input"
            ? '<input id="field" value="alpha beta">'
            : '<textarea id="field">alpha beta</textarea>'
        );
        const r = runtime(f);
        try {
          const input = document.getElementById("field") as HTMLInputElement | HTMLTextAreaElement;
          input.focus();
          input.setSelectionRange(0, 0);
          const count = document.querySelectorAll("[data-sonner-toaster] > li").length;
          await press(key, { ctrlKey: key === "[" });
          check(document.activeElement !== input);
          equal(document.querySelectorAll("[data-sonner-toaster] > li").length, count);
          await press("v");
          equal(f.mode.getMode(), "visual");
          equal(document.activeElement, input);
          if (document.documentElement.dataset.browser === "chromium") {
            await press("e");
            equal(f.selection.text(), "alpha");
            await press("y");
            equal(copied.at(-1), "alpha");
          }
        } finally {
          r.close();
        }
      }
    }
  }
);
await runAsync("fixed exit keys preserve a backward field selection for v", async () => {
  for (const key of ["Escape", "["]) {
    const f = fixture('<textarea id="field">alpha beta</textarea>');
    const r = runtime(f);
    try {
      const input = document.getElementById("field") as HTMLTextAreaElement;
      input.focus();
      input.setSelectionRange(6, 10, "backward");
      await press(key, { ctrlKey: key === "[" });
      equal(input.value, "alpha beta");
      check(document.activeElement !== input);
      await press("v");
      equal(document.activeElement, input);
      equal(input.selectionStart, 6);
      equal(input.selectionEnd, 10);
      equal(input.selectionDirection, "backward");
      equal(f.selection.text(), "beta");
    } finally {
      r.close();
    }
  }
});
await runAsync("kj types immediately and native undo preserves editing", async () => {
  const f = fixture('<textarea id="field"></textarea>');
  const r = runtime(f);
  try {
    const input = document.getElementById("field") as HTMLTextAreaElement;
    input.focus();
    await press("k");
    equal(input.value, "k");
    await press("j");
    equal(input.value, "kj");
    equal(document.activeElement, input);
    if (document.documentElement.dataset.browser === "chromium") {
      await press("z", { metaKey: true });
      check(input.value !== "kj");
    }
  } finally {
    r.close();
  }
});
await runAsync("visual copy actions combine mode change and yank feedback", async () => {
  for (const action of [
    "visual-yank",
    "visual-yank-line",
    "visual-open-current-tab",
    "visual-open-new-tab"
  ] as const) {
    const f = fixture();
    f.select(0, 1);
    f.visual.actions["visual-mode"]();
    const before = new Set(document.querySelectorAll("[data-sonner-toaster] > li"));
    f.visual.actions[action]();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const added = Array.from(document.querySelectorAll("[data-sonner-toaster] > li")).filter(
      (toast) => !before.has(toast)
    );
    equal(added.length, 1);
    check(added[0]!.textContent?.includes("Normal mode"));
    check(
      added[0]!.textContent?.includes(
        action === "visual-yank-line" ? "Yanked" : "Yanked 1 character."
      )
    );
  }
});
await runAsync("failed visual copying produces one combined error toast", async () => {
  const f = fixture();
  const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard")!;
  const command = document.execCommand;
  try {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        }
      }
    });
    document.execCommand = () => false;
    f.select(0, 1);
    f.visual.actions["visual-mode"]();
    const before = new Set(document.querySelectorAll("[data-sonner-toaster] > li"));
    f.visual.actions["visual-yank"]();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const added = Array.from(document.querySelectorAll("[data-sonner-toaster] > li")).filter(
      (toast) => !before.has(toast)
    );
    equal(added.length, 1);
    equal(added[0]!.getAttribute("data-type"), "error");
    check(added[0]!.textContent?.includes("Normal mode"));
    check(added[0]!.textContent?.includes("Could not copy selected text"));
  } finally {
    Object.defineProperty(navigator, "clipboard", clipboard);
    document.execCommand = command;
  }
});
await runAsync("short mode toasts expire without changing regular toast duration", async () => {
  const f = fixture();
  f.select(0, 1);
  f.visual.actions["visual-mode"]();
  const toast =
    document.querySelector('[data-sonner-toast][data-duration="1000"]') ??
    document.querySelector('[data-duration="1000"]');
  check(toast);
  f.visual.actions["visual-word-end"]();
  equal(document.querySelectorAll('[data-duration="1000"]').length, 1);
  const regular = getToastApi().info("Regular notification") as HTMLElement;
  await new Promise((resolve) => setTimeout(resolve, 1300));
  check(!toast?.isConnected);
  check(regular.isConnected);
  f.visual.exit();
});

await fetch("/result", { method: "POST", body: JSON.stringify({ passed, failed }) });