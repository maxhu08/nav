import { describe, expect, test } from "bun:test";
import { createNavigationKeydownHandler } from "~/src/core/navigation/keydown";
import { createKeyboardPriorityController } from "~/src/core/navigation/keyboard-priority";
import { createKeyState } from "~/src/core/utils/key-state";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("keyboard priority", () => {
  test("suppresses page keypress and keyup after nav claims a keydown", () => {
    const fixture = createDomFixture("<div></div>");
    const keyboardPriority = createKeyboardPriorityController();

    try {
      keyboardPriority.install();

      const receivedEvents: string[] = [];
      document.addEventListener("keypress", (event) => {
        receivedEvents.push(`keypress:${event.key}`);
      });
      document.addEventListener("keyup", (event) => {
        receivedEvents.push(`keyup:${event.key}`);
      });

      keyboardPriority.handleConsumedKeydown(
        new window.KeyboardEvent("keydown", { bubbles: true, code: "KeyJ", key: "j" })
      );

      document.dispatchEvent(
        new window.KeyboardEvent("keypress", { bubbles: true, code: "KeyJ", key: "j" })
      );
      document.dispatchEvent(
        new window.KeyboardEvent("keyup", { bubbles: true, code: "KeyJ", key: "j" })
      );
      document.dispatchEvent(
        new window.KeyboardEvent("keypress", { bubbles: true, code: "KeyK", key: "k" })
      );

      expect(receivedEvents).toEqual(["keypress:k"]);
    } finally {
      keyboardPriority.uninstall();
      fixture.cleanup();
    }
  });

  test("clears stale claims when the same key starts a fresh keydown", () => {
    const fixture = createDomFixture("<div></div>");
    const keyboardPriority = createKeyboardPriorityController();

    try {
      keyboardPriority.install();

      const receivedEvents: string[] = [];
      document.addEventListener("keypress", (event) => {
        receivedEvents.push(`keypress:${event.key}`);
      });

      keyboardPriority.handleConsumedKeydown(
        new window.KeyboardEvent("keydown", { bubbles: true, code: "KeyJ", key: "j" })
      );

      document.dispatchEvent(
        new window.KeyboardEvent("keydown", { bubbles: true, code: "KeyJ", key: "j" })
      );
      document.dispatchEvent(
        new window.KeyboardEvent("keypress", { bubbles: true, code: "KeyJ", key: "j" })
      );

      expect(receivedEvents).toEqual(["keypress:j"]);
    } finally {
      keyboardPriority.uninstall();
      fixture.cleanup();
    }
  });

  test("allows site multi-key sequences when nav only uses the prefix for another binding", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      const keyState = createKeyState({
        getMode: () => "normal"
      });

      keyState.applyHotkeyMappings({ gh: { normal: "scroll-down" } }, { g: true });

      let navActionCount = 0;
      const handleKeydown = createNavigationKeydownHandler({
        actions: {
          "scroll-down": () => {
            navActionCount += 1;
            return true;
          }
        } as never,
        findMode: {
          handleFindUIKeydown: () => false,
          exitFindMode: () => {},
          isFindModeActive: () => false,
          shouldIgnoreKeydownInFindUI: () => false
        },
        hintController: {
          activateMode: () => false,
          exitHintMode: () => {},
          handleHintKeydown: () => false,
          isHintModeActive: () => false
        },
        forceNormalMode: {
          isEnabled: () => false,
          handleKeydownCapture: () => {}
        },
        isScrollAction: (actionName) => actionName === "scroll-down",
        keyState,
        onConsumeKeydown: () => {},
        watchController: {
          exitWatchMode: () => {},
          getWatchActionSequences: () => ({
            "toggle-fullscreen": "f",
            "toggle-play-pause": "e",
            "toggle-loop": "l",
            "toggle-mute": "m",
            "toggle-captions": "c"
          }),
          isWatchModeActive: () => false,
          toggleFullscreen: () => false,
          toggleWatchCaptions: () => false,
          toggleWatchLoop: () => false,
          toggleWatchMute: () => false,
          toggleWatchPlayPause: () => false
        }
      });

      const receivedKeys: string[] = [];
      window.addEventListener("keydown", handleKeydown, true);
      document.addEventListener("keydown", (event) => {
        receivedKeys.push(event.key);
      });

      document.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: "g" }));
      document.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: "n" }));

      expect(navActionCount).toBe(0);
      expect(receivedKeys).toEqual(["g", "n"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("claims shared prefixes when multiple nav actions depend on them", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      const keyState = createKeyState({
        getMode: () => "normal"
      });

      keyState.applyHotkeyMappings(
        {
          yy: { normal: "yank-current-tab-url" },
          yl: { normal: "yank-link-url" }
        },
        { y: true }
      );

      const receivedKeys: string[] = [];
      const handleKeydown = createNavigationKeydownHandler({
        actions: {
          "yank-current-tab-url": () => true,
          "yank-link-url": () => true
        } as never,
        findMode: {
          handleFindUIKeydown: () => false,
          exitFindMode: () => {},
          isFindModeActive: () => false,
          shouldIgnoreKeydownInFindUI: () => false
        },
        hintController: {
          activateMode: () => false,
          exitHintMode: () => {},
          handleHintKeydown: () => false,
          isHintModeActive: () => false
        },
        forceNormalMode: {
          isEnabled: () => false,
          handleKeydownCapture: () => {}
        },
        isScrollAction: () => false,
        keyState,
        onConsumeKeydown: () => {},
        watchController: {
          exitWatchMode: () => {},
          getWatchActionSequences: () => ({
            "toggle-fullscreen": "f",
            "toggle-play-pause": "e",
            "toggle-loop": "l",
            "toggle-mute": "m",
            "toggle-captions": "c"
          }),
          isWatchModeActive: () => false,
          toggleFullscreen: () => false,
          toggleWatchCaptions: () => false,
          toggleWatchLoop: () => false,
          toggleWatchMute: () => false,
          toggleWatchPlayPause: () => false
        }
      });

      window.addEventListener("keydown", handleKeydown, true);
      document.addEventListener("keydown", (event) => {
        receivedKeys.push(event.key);
      });

      document.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: "y" }));

      expect(receivedKeys).toEqual([]);
    } finally {
      fixture.cleanup();
    }
  });

  test("ignores action mappings while hint mode is active", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      let clearPendingStateCount = 0;
      let getActionNameCount = 0;
      const handledKeys: string[] = [];
      const handleKeydown = createNavigationKeydownHandler({
        actions: {} as never,
        findMode: {
          handleFindUIKeydown: () => false,
          exitFindMode: () => {},
          isFindModeActive: () => false,
          shouldIgnoreKeydownInFindUI: () => false
        },
        hintController: {
          activateMode: () => false,
          exitHintMode: () => {},
          handleHintKeydown: (event) => {
            handledKeys.push(event.key);
            return true;
          },
          isHintModeActive: () => true
        },
        forceNormalMode: {
          isEnabled: () => false,
          handleKeydownCapture: () => {}
        },
        isScrollAction: () => false,
        keyState: {
          clearPendingCount: () => {},
          clearPendingState: () => {
            clearPendingStateCount += 1;
          },
          getActionName: () => {
            getActionNameCount += 1;
            return {
              actionName: null,
              claimKeydown: false,
              consumed: false,
              matchedSequence: null
            };
          },
          getWatchActionName: () => ({
            actionName: null,
            claimKeydown: false,
            consumed: false,
            matchedSequence: null
          }),
          hasAllowedActionMappings: () => true,
          isActionAllowed: () => true,
          resolveCount: () => 1
        },
        onConsumeKeydown: () => {},
        watchController: {
          exitWatchMode: () => {},
          getWatchActionSequences: () => ({
            "toggle-fullscreen": "f",
            "toggle-play-pause": "e",
            "toggle-loop": "l",
            "toggle-mute": "m",
            "toggle-captions": "c"
          }),
          isWatchModeActive: () => false,
          toggleFullscreen: () => false,
          toggleWatchCaptions: () => false,
          toggleWatchLoop: () => false,
          toggleWatchMute: () => false,
          toggleWatchPlayPause: () => false
        }
      });

      handleKeydown(new window.KeyboardEvent("keydown", { key: "d" }));

      expect(handledKeys).toEqual(["d"]);
      expect(clearPendingStateCount).toBe(1);
      expect(getActionNameCount).toBe(0);
    } finally {
      fixture.cleanup();
    }
  });
});