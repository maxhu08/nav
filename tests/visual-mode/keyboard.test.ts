import { describe, expect, test } from "bun:test";
import { createKeyState } from "~/src/core/utils/key-state";
import { createModeController } from "~/src/core/navigation/shared";
import { createNavigationKeydownHandler } from "~/src/core/navigation/keydown";
import type { ActionHandler } from "~/src/core/navigation/shared";
import { DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/config-defaults";
import { parseHotkeyMappingsValue, VALID_ACTION_NAMES, type ActionName } from "~/src/utils/hotkeys";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const setup = () => {
  const fixture = createDomFixture('<input id="input">');
  const mode = createModeController();
  const keys = createKeyState({ getMode: mode.getMode });
  const mappings = parseHotkeyMappingsValue(DEFAULT_HOTKEY_MAPPINGS).mappings;
  keys.applyHotkeyMappings(
    mappings,
    Object.fromEntries(
      Object.keys(mappings).flatMap((key) =>
        Array.from({ length: key.length - 1 }, (_, index) => [key.slice(0, index + 1), true])
      )
    )
  );
  const calls: Array<{ action: ActionName; count: number | undefined }> = [];
  const actions = Object.fromEntries(
    Array.from(VALID_ACTION_NAMES, (action) => [
      action,
      (count?: number) => {
        calls.push({ action, count });
        return true;
      }
    ])
  ) as Record<ActionName, ActionHandler>;
  const handler = createNavigationKeydownHandler({
    onExitTyping: () => {},
    actions,
    keyState: keys,
    onConsumeKeydown: () => {},
    isScrollAction: () => false,
    visualController: {
      isActive: () => ["caret", "visual", "visual-line"].includes(mode.getMode()),
      exit: () => {
        mode.setMode("normal");
        keys.clearPendingState();
      }
    },
    findMode: {
      handleFindUIKeydown: () => false,
      exitFindMode: () => {},
      isFindInputFocused: () => false,
      isFindModeActive: () => false,
      shouldIgnoreKeydownInFindUI: () => false
    },
    forceNormalMode: { isEnabled: () => false, handleKeydownCapture: () => {} },
    hintController: {
      activateMode: () => false,
      exitHintMode: () => {},
      handleHintKeydown: () => false,
      isHintModeActive: () => false
    },
    watchController: {
      exitWatchMode: () => {},
      getWatchActionSequences: () => ({
        "toggle-fullscreen": "f",
        "toggle-play-pause": "e",
        "toggle-loop": "l",
        "toggle-mute": "m",
        "toggle-captions": "c",
        "decrease-speed": "j",
        "increase-speed": "k"
      }),
      isWatchModeActive: () => false,
      toggleFullscreen: () => false,
      toggleWatchCaptions: () => false,
      toggleWatchLoop: () => false,
      toggleWatchMute: () => false,
      toggleWatchPlayPause: () => false,
      decreaseSpeed: () => false,
      increaseSpeed: () => false
    }
  });
  const press = (key: string, options?: KeyboardEventInit): KeyboardEvent => {
    const event = new window.KeyboardEvent("keydown", { key, cancelable: true, ...options });
    handler(event);
    return event;
  };
  return { fixture, mode, keys, calls, press };
};

describe("visual keyboard routing", () => {
  test("fixed typing exits blur fields, but ordinary typing and modified brackets stay native", () => {
    const f = setup();
    try {
      const input = document.getElementById("input")!;
      for (const key of ["Escape", "["]) {
        input.focus();
        f.press("g");
        expect(f.press("k").defaultPrevented).toBe(false);
        expect(f.press("j").defaultPrevented).toBe(false);
        expect(f.press("[", { ctrlKey: true, altKey: true }).defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(input);
        expect(f.press(key, { ctrlKey: key === "[" }).defaultPrevented).toBe(true);
        expect(document.activeElement).not.toBe(input);
        expect(f.keys.hasPendingState()).toBe(false);
      }
      expect(f.calls).toEqual([]);
    } finally {
      f.fixture.cleanup();
    }
  });
  test("IME escape events and fixed typing exits on disabled sites are left to the page", () => {
    const f = setup();
    try {
      const input = document.getElementById("input")!;
      input.focus();
      expect(f.press("Escape", { isComposing: true }).defaultPrevented).toBe(false);
      expect(f.press("Escape", { keyCode: 229 }).defaultPrevented).toBe(false);
      expect(f.press("[", { ctrlKey: true, isComposing: true }).defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(input);
      f.keys.applyUrlRules({ mode: "whitelist", blacklist: [], whitelist: [] });
      expect(f.press("Escape").defaultPrevented).toBe(false);
      expect(f.press("[", { ctrlKey: true }).defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(input);
    } finally {
      f.fixture.cleanup();
    }
  });
  test("all three selection modes share only visual actions, including counts and arrows", () => {
    const f = setup();
    try {
      for (const mode of ["caret", "visual", "visual-line"] as const) {
        f.mode.setMode(mode);
        f.press("3");
        f.press("w");
        f.press("ArrowDown");
        f.press("0");
        f.press("g");
        f.press("g");
      }
      expect(f.calls).toEqual(
        Array.from(
          { length: 3 },
          () =>
            [
              { action: "visual-word-forward", count: 3 },
              { action: "visual-down", count: 1 },
              { action: "visual-line-start", count: 1 },
              { action: "visual-document-start", count: 1 }
            ] as const
        ).flat()
      );
      expect(f.press("t").defaultPrevented).toBe(true);
      expect(f.calls).toHaveLength(12);
    } finally {
      f.fixture.cleanup();
    }
  });
  test("first Escape clears a prefix/count and second Escape exits", () => {
    const f = setup();
    try {
      f.mode.setMode("visual");
      f.press("2");
      f.press("g");
      f.press("Escape");
      expect(f.mode.getMode()).toBe("visual");
      expect(f.keys.hasPendingState()).toBe(false);
      f.press("Escape");
      expect(f.mode.getMode()).toBe("normal");
      f.mode.setMode("visual-line");
      f.press("[", { ctrlKey: true });
      expect(f.mode.getMode()).toBe("normal");
    } finally {
      f.fixture.cleanup();
    }
  });
  test("typing stays native in editables unless a selection mode is already active", () => {
    const f = setup();
    try {
      document.getElementById("input")!.focus();
      expect(f.press("v").defaultPrevented).toBe(false);
      expect(f.calls).toEqual([]);
      f.mode.setMode("visual");
      expect(f.press("w").defaultPrevented).toBe(true);
      expect(f.calls[0]?.action).toBe("visual-word-forward");
      f.press("Enter", { shiftKey: true });
      expect(f.calls).toHaveLength(1);
      f.press("Enter");
      expect(f.calls[1]?.action).toBe("visual-yank");
    } finally {
      f.fixture.cleanup();
    }
  });
  test("URL rules deny visual actions without falling back to normal actions or trapping Escape", () => {
    const f = setup();
    try {
      f.mode.setMode("visual");
      f.keys.applyUrlRules({
        mode: "blacklist",
        blacklist: [{ pattern: ".*", mode: "deny", actions: { "visual-word-forward": true } }],
        whitelist: []
      });
      f.press("w");
      expect(f.calls).toEqual([]);
      f.keys.applyUrlRules({ mode: "whitelist", blacklist: [], whitelist: [] });
      f.press("Escape");
      expect(f.mode.getMode()).toBe("normal");
    } finally {
      f.fixture.cleanup();
    }
  });
});