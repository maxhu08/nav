import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { createWatchController } from "~/src/core/actions/watch-mode";
import { WATCH_HINTS_ID } from "~/src/core/utils/get-ui";
import {
  activateSiteKeybindIgnore,
  deactivateSiteKeybindIgnore,
  resetSiteKeybindIgnoreForTests
} from "~/src/core/utils/ignore-site-keybinds";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import { createNavigationKeydownHandler } from "~/src/core/navigation/keydown";
import { createKeyState } from "~/src/core/utils/key-state";
import { DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/config-defaults";
import { DEFAULT_HINT_CUSTOM_CSS } from "~/src/utils/config";
import { HOTKEY_UNBOUND_SEQUENCE, parseHotkeyMappingsValue } from "~/src/utils/hotkeys";
import {
  WATCH_PROHIBITED_ICON_PATH,
  WATCH_REWIND_ICON_PATH,
  WATCH_SPEED_ICON_PATH
} from "~/src/lib/inline-icons";

const setVideoRect = (video: HTMLVideoElement, top: number): void => {
  const rect = new DOMRect(0, top, 640, 360);
  video.getBoundingClientRect = (): DOMRect => rect;
};

describe("watch playback speed lifecycle", () => {
  let fixture: ReturnType<typeof createDomFixture>;
  let controller: ReturnType<typeof createWatchController>;
  let video: HTMLVideoElement;
  let mode: "normal" | "watch";

  beforeEach(async () => {
    fixture = createDomFixture("<video src='/first.mp4'></video>");
    mode = "normal";
    const module = await import("~/src/core/actions/watch-mode");
    controller = module.createWatchController({
      isWatchMode: () => mode === "watch",
      setMode: (value) => {
        mode = value;
      },
      getActionSequence: (_, fallback) => fallback
    });
    video = document.querySelector("video")!;
    setVideoRect(video, 0);
    controller.toggleVideoControls();
  });

  afterEach(() => {
    resetSiteKeybindIgnoreForTests();
    fixture.cleanup();
  });

  test("resets a reused SPA player when its source changes, not when its URL changes", () => {
    controller.increaseSpeed();
    history.pushState({}, "", "/watch/second");
    controller.handleWatchRouteChange();
    expect(video.playbackRate).toBe(1.25);

    video.src = "/second.mp4";
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1);
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("false");
    expect(mode).toBe("normal");
  });

  test("resets the next source after exiting watch mode without resetting the current video", () => {
    controller.increaseSpeed();
    controller.exitWatchMode();
    expect(video.playbackRate).toBe(1.25);

    history.pushState({}, "", "/watch/second");
    controller.handleWatchRouteChange();
    expect(video.playbackRate).toBe(1.25);
    video.src = "/second.mp4";
    controller.handleWatchMediaStateChange();
    expect(video.playbackRate).toBe(1);
    expect(mode).toBe("normal");
  });

  for (const active of [true, false]) {
    test(`resets a replacement player with watch mode ${active ? "active" : "inactive"}`, () => {
      controller.increaseSpeed();
      if (!active) controller.exitWatchMode();
      video.remove();
      controller.handleWatchDomMutation();

      const next = document.createElement("video");
      next.src = "/second.mp4";
      next.playbackRate = 1.25;
      setVideoRect(next, 0);
      fixture.root.append(next);
      controller.handleWatchDomMutation();

      expect(next.playbackRate).toBe(1);
      expect(mode).toBe("normal");
      expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("false");
    });
  }

  test("preserves speed for timestamps, seeks, and repeated media events on the same video", () => {
    controller.increaseSpeed();
    history.replaceState({}, "", "/watch/first?t=30#player");
    controller.handleWatchRouteChange();
    video.currentTime = 30;
    controller.handleWatchMediaStateChange();
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1.25);
    expect(mode).toBe("watch");
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("true");
  });

  test("resets once per new source and allows subsequent speed adjustments", () => {
    controller.increaseSpeed();
    video.src = "/second.mp4";
    controller.handleWatchMediaStateChange();
    expect(video.playbackRate).toBe(1);
    controller.toggleVideoControls();
    controller.increaseSpeed();
    controller.handleWatchMediaStateChange();
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1.25);

    video.src = "/third.mp4";
    controller.handleWatchMediaStateChange();
    expect(video.playbackRate).toBe(1);
  });

  test("does not mistake temporary source removal for another video", () => {
    controller.increaseSpeed();
    video.removeAttribute("src");
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1.25);
    video.src = "/first.mp4";
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1.25);
    video.src = "/second.mp4";
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1);
  });

  test("leaves site-selected speeds alone until Nav changes speed", () => {
    video.playbackRate = 1.75;
    video.src = "/second.mp4";
    controller.handleWatchMediaStateChange();
    expect(video.playbackRate).toBe(1.75);
  });

  test("does not reset twice when currentSrc catches up to the declared source", () => {
    controller.increaseSpeed();
    Object.defineProperty(video, "currentSrc", {
      configurable: true,
      value: "https://example.com/first.mp4"
    });
    video.src = "/second.mp4";
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1);
    controller.toggleVideoControls();
    controller.increaseSpeed();
    Object.defineProperty(video, "currentSrc", { value: "https://example.com/second.mp4" });
    controller.handleWatchMediaStateChange();
    expect(video.playbackRate).toBe(1.25);
  });

  test("keeps the active watch target when unrelated videos become better candidates", () => {
    controller.increaseSpeed();
    const other = document.createElement("video");
    other.src = "/other.mp4";
    other.playbackRate = 1.75;
    Object.defineProperty(other, "paused", { value: false });
    setVideoRect(other, 0);
    fixture.root.append(other);
    video.blur();
    controller.handleWatchMediaStateChange();
    controller.handleWatchDomMutation();
    expect(video.playbackRate).toBe(1.25);
    expect(other.playbackRate).toBe(1.75);
  });

  test("exits watch mode on a new source even if Nav never changed speed", () => {
    const keys: string[] = [];
    document.addEventListener("keydown", (event) => keys.push(event.key));
    video.src = "/second.mp4";
    controller.handleWatchMediaStateChange();
    expect(mode).toBe("normal");
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("false");
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "j", bubbles: true }));
    expect(keys).toEqual(["j"]);
  });

  test("exits watch mode on a replacement player even if Nav never changed speed", () => {
    const next = document.createElement("video");
    setVideoRect(next, 0);
    video.replaceWith(next);
    controller.handleWatchDomMutation();
    expect(mode).toBe("normal");
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("false");
  });

  test("keeps the overlay hidden until watch mode is explicitly enabled again", () => {
    controller.increaseSpeed();
    video.src = "/second.mp4";
    controller.handleWatchMediaStateChange();
    controller.handleWatchDomMutation();
    controller.syncWatchHintsOverlay();
    controller.handleWatchMediaStateChange();
    expect(controller.isWatchModeActive()).toBe(false);
    expect(controller.increaseSpeed()).toBe(false);
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("false");

    expect(controller.toggleVideoControls()).toBe(true);
    expect(controller.isWatchModeActive()).toBe(true);
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("true");
    expect(document.querySelector('[data-watch-speed="true"]')?.textContent).toBe("1.00×");
  });
});

describe("watch mode", () => {
  test("adjusts speed with j/k without scrolling or exiting watch mode", async () => {
    const fixture = createDomFixture("<video id='video'></video>");

    try {
      const style = document.createElement("style");
      // jsdom does not resolve inherited CSS variables.
      style.textContent = DEFAULT_HINT_CUSTOM_CSS.replace("var(--nav-hint-marker-bg)", "#eab308");
      document.head.append(style);
      const { createWatchController } = await import("~/src/core/actions/watch-mode");
      let mode: "normal" | "watch" = "normal";
      const keyState = createKeyState({ getMode: () => mode });
      keyState.applyHotkeyMappings(parseHotkeyMappingsValue(DEFAULT_HOTKEY_MAPPINGS).mappings, {});
      const controller = createWatchController({
        isWatchMode: () => mode === "watch",
        setMode: (value) => {
          mode = value;
        },
        getActionSequence: keyState.getActionSequence
      });
      const video = document.getElementById("video") as HTMLVideoElement;
      setVideoRect(video, 0);
      expect(controller.toggleVideoControls()).toBe(true);

      let scrolls = 0;
      const handleKeydown = createNavigationKeydownHandler({
        onExitTyping: () => {},
        visualController: { isActive: () => false, exit: () => {} },
        actions: {
          "scroll-down": () => {
            scrolls += 1;
            return true;
          },
          "scroll-up": () => {
            scrolls += 1;
            return true;
          }
        } as never,
        findMode: {
          handleFindUIKeydown: () => false,
          exitFindMode: () => {},
          isFindInputFocused: () => false,
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
        isScrollAction: () => true,
        keyState,
        onConsumeKeydown: () => {},
        watchController: controller
      });

      expect(document.querySelector('[data-watch-speed="true"]')?.textContent).toBe("1.00×");
      for (const key of ["k", "k", "j"]) {
        const event = new window.KeyboardEvent("keydown", { key, cancelable: true });
        handleKeydown(event);
        expect(event.defaultPrevented).toBe(true);
      }

      expect(video.playbackRate).toBe(1.25);
      expect(scrolls).toBe(0);
      expect(String(mode)).toBe("watch");
      expect(document.querySelector('[data-watch-speed="true"]')?.textContent).toBe("1.25×");
      expect(document.querySelector('[data-watch-area="slower"]')?.textContent).toBe("j");
      expect(document.querySelector('[data-watch-area="faster"]')?.textContent).toBe("k");
      expect(document.querySelectorAll('[data-watch-tile="true"] img')).toHaveLength(0);
      expect(document.querySelector('[data-watch-area="slower"] svg path')?.getAttribute("d")).toBe(
        WATCH_REWIND_ICON_PATH
      );
      expect(document.querySelector('[data-watch-area="faster"] svg path')?.getAttribute("d")).toBe(
        WATCH_SPEED_ICON_PATH
      );
      expect(
        getComputedStyle(document.querySelector('[data-watch-speed="true"]') as HTMLSpanElement)
          .backgroundColor
      ).toBe("rgb(234, 179, 8)");

      video.playbackRate = 0.25;
      handleKeydown(new window.KeyboardEvent("keydown", { key: "j" }));
      expect(video.playbackRate).toBe(0.25);
      video.playbackRate = 16;
      handleKeydown(new window.KeyboardEvent("keydown", { key: "k" }));
      expect(video.playbackRate).toBe(16);

      for (const [rate, display] of [
        [0.5, "0.50×"],
        [1.5, "1.50×"],
        [2, "2.00×"]
      ] as const) {
        video.playbackRate = rate;
        controller.handleWatchMediaStateChange();
        expect(document.querySelector('[data-watch-speed="true"]')?.textContent).toBe(display);
      }

      video.playbackRate = 1.75;
      controller.handleWatchMediaStateChange();
      expect(document.querySelector('[data-watch-speed="true"]')?.textContent).toBe("1.75×");

      controller.exitWatchMode();
      expect(controller.increaseSpeed()).toBe(false);
      expect(controller.decreaseSpeed()).toBe(false);
      expect(video.playbackRate).toBe(1.75);
    } finally {
      resetSiteKeybindIgnoreForTests();
      fixture.cleanup();
    }
  });

  test("shows a prohibited icon instead of the shortcut for every unbound watch action", async () => {
    const fixture = createDomFixture("<video id='video'></video>");

    try {
      const { createWatchController } = await import("~/src/core/actions/watch-mode");
      let mode: "normal" | "watch" = "normal";
      const keyState = createKeyState({ getMode: () => mode });
      keyState.applyHotkeyMappings(parseHotkeyMappingsValue(DEFAULT_HOTKEY_MAPPINGS).mappings, {});
      const controller = createWatchController({
        isWatchMode: () => mode === "watch",
        setMode: (value) => {
          mode = value;
        },
        getActionSequence: keyState.getActionSequence
      });
      setVideoRect(document.getElementById("video") as HTMLVideoElement, 0);
      expect(controller.toggleVideoControls()).toBe(true);
      expect(document.querySelectorAll('[data-watch-label="true"] svg')).toHaveLength(0);

      const mappings = parseHotkeyMappingsValue(DEFAULT_HOTKEY_MAPPINGS).mappings;
      for (const binding of Object.values(mappings)) {
        if (binding) delete binding.watch;
      }
      keyState.applyHotkeyMappings(mappings, {});
      controller.syncWatchHintsOverlay();

      const labels = document.querySelectorAll('[data-watch-label="true"]');
      expect(labels).toHaveLength(7);
      for (const label of labels) {
        expect(label.textContent).toBe("");
        expect(label.querySelector("svg path")?.getAttribute("d")).toBe(WATCH_PROHIBITED_ICON_PATH);
        expect(label.getAttribute("aria-label")).toBe("Unbound");
      }
      for (const key of ["f", "e", "l", "m", "c", "j", "k", "<"]) {
        expect(
          keyState.getWatchActionName(key, controller.getWatchActionSequences())
        ).toMatchObject({
          actionName: null,
          consumed: false
        });
      }
      expect(Object.values(controller.getWatchActionSequences())).toEqual(
        Array(7).fill(HOTKEY_UNBOUND_SEQUENCE)
      );
    } finally {
      resetSiteKeybindIgnoreForTests();
      fixture.cleanup();
    }
  });

  test("preserves configured shortcut casing and updates labels when mappings change", async () => {
    const fixture = createDomFixture("<video id='video'></video>");

    try {
      const { createWatchController } = await import("~/src/core/actions/watch-mode");
      let mode: "normal" | "watch" = "normal";
      const keyState = createKeyState({ getMode: () => mode });
      keyState.applyHotkeyMappings(
        parseHotkeyMappingsValue(
          DEFAULT_HOTKEY_MAPPINGS.replace("j decrease-speed", "J decrease-speed")
            .replace("k increase-speed", "zK increase-speed")
            .replace("f toggle-fullscreen", "<c-F> toggle-fullscreen")
        ).mappings,
        { z: true }
      );
      const controller = createWatchController({
        isWatchMode: () => mode === "watch",
        setMode: (value) => {
          mode = value;
        },
        getActionSequence: keyState.getActionSequence
      });
      setVideoRect(document.getElementById("video") as HTMLVideoElement, 0);
      expect(controller.toggleVideoControls()).toBe(true);

      expect(document.querySelector('[data-watch-area="slower"]')?.textContent).toBe("J");
      expect(document.querySelector('[data-watch-area="faster"]')?.textContent).toBe("zK");
      expect(document.querySelector('[data-watch-area="fullscreen"]')?.textContent).toBe("<c-F>");
      expect(
        getComputedStyle(document.querySelector('[data-watch-label="true"]') as HTMLSpanElement)
          .textTransform
      ).toBe("none");
      expect(
        keyState.getWatchActionName("j", controller.getWatchActionSequences()).actionName
      ).toBeNull();
      expect(
        keyState.getWatchActionName("J", controller.getWatchActionSequences()).actionName
      ).toBe("decrease-speed");
      expect(keyState.getWatchActionName("z", controller.getWatchActionSequences()).consumed).toBe(
        true
      );
      expect(
        keyState.getWatchActionName("K", controller.getWatchActionSequences()).actionName
      ).toBe("increase-speed");

      keyState.applyHotkeyMappings(parseHotkeyMappingsValue(DEFAULT_HOTKEY_MAPPINGS).mappings, {});
      controller.syncWatchHintsOverlay();
      expect(document.querySelector('[data-watch-area="slower"]')?.textContent).toBe("j");
      expect(document.querySelector('[data-watch-area="faster"]')?.textContent).toBe("k");
      expect(document.querySelector('[data-watch-area="fullscreen"]')?.textContent).toBe("f");
    } finally {
      resetSiteKeybindIgnoreForTests();
      fixture.cleanup();
    }
  });

  test("shared site keybind ignore suppresses page listeners while active", () => {
    const fixture = createDomFixture("<input id='field' />");

    try {
      const receivedKeys: string[] = [];
      document.addEventListener("keydown", (event) => {
        receivedKeys.push(event.key);
      });

      activateSiteKeybindIgnore("watch");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: "k" }));

      deactivateSiteKeybindIgnore("watch");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: "j" }));

      expect(receivedKeys).toEqual(["j"]);
    } finally {
      resetSiteKeybindIgnoreForTests();
      fixture.cleanup();
    }
  });

  test("requires re-enabling watch mode on a new video after spa navigation", async () => {
    const fixture = createDomFixture("<video id='first-video'></video>");

    try {
      const { createWatchController } = await import("~/src/core/actions/watch-mode");
      let mode: "normal" | "watch" = "normal";
      const watchController = createWatchController({
        isWatchMode: () => mode === "watch",
        setMode: (nextMode): void => {
          mode = nextMode;
        },
        getActionSequence: (_, fallback) => fallback
      });

      const firstVideo = document.getElementById("first-video") as HTMLVideoElement;
      setVideoRect(firstVideo, 0);

      let didRequestFullscreenOnFirstVideo = false;
      firstVideo.requestFullscreen = () => {
        didRequestFullscreenOnFirstVideo = true;
        return Promise.resolve();
      };

      expect(watchController.toggleVideoControls()).toBe(true);
      expect(String(mode)).toBe("watch");

      history.pushState({}, "", "/watch/2");
      firstVideo.style.display = "none";
      watchController.handleWatchRouteChange();

      const secondVideo = document.createElement("video");
      secondVideo.id = "second-video";
      setVideoRect(secondVideo, 24);

      let didRequestFullscreenOnSecondVideo = false;
      secondVideo.requestFullscreen = () => {
        didRequestFullscreenOnSecondVideo = true;
        return Promise.resolve();
      };

      document.body.append(secondVideo);
      watchController.handleWatchDomMutation();

      expect(String(mode)).toBe("normal");
      expect(watchController.toggleFullscreen()).toBe(false);
      expect(watchController.toggleVideoControls()).toBe(true);
      expect(watchController.toggleFullscreen()).toBe(true);
      expect(didRequestFullscreenOnFirstVideo).toBe(false);
      expect(didRequestFullscreenOnSecondVideo).toBe(true);
      expect(String(mode)).toBe("normal");
    } finally {
      fixture.cleanup();
    }
  });

  test("re-evaluates the target video each time watch mode is enabled", async () => {
    const fixture = createDomFixture("<video id='first-video'></video>");

    try {
      const { createWatchController } = await import("~/src/core/actions/watch-mode");
      let mode: "normal" | "watch" = "normal";
      const watchController = createWatchController({
        isWatchMode: () => mode === "watch",
        setMode: (nextMode): void => {
          mode = nextMode;
        },
        getActionSequence: (_, fallback) => fallback
      });

      const firstVideo = document.getElementById("first-video") as HTMLVideoElement;
      setVideoRect(firstVideo, 0);

      let didRequestFullscreenOnFirstVideo = false;
      firstVideo.requestFullscreen = () => {
        didRequestFullscreenOnFirstVideo = true;
        return Promise.resolve();
      };

      expect(watchController.toggleVideoControls()).toBe(true);
      expect(watchController.toggleVideoControls()).toBe(true);
      expect(String(mode)).toBe("normal");

      firstVideo.style.display = "none";
      const secondVideo = document.createElement("video");
      setVideoRect(secondVideo, 24);

      let didRequestFullscreenOnSecondVideo = false;
      secondVideo.requestFullscreen = () => {
        didRequestFullscreenOnSecondVideo = true;
        return Promise.resolve();
      };

      document.body.append(secondVideo);

      expect(watchController.toggleVideoControls()).toBe(true);
      expect(watchController.toggleFullscreen()).toBe(true);
      expect(didRequestFullscreenOnFirstVideo).toBe(false);
      expect(didRequestFullscreenOnSecondVideo).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps watch controls working for an offscreen active video", async () => {
    const fixture = createDomFixture("<video id='video'></video>");

    try {
      const { createWatchController } = await import("~/src/core/actions/watch-mode");
      let mode: "normal" | "watch" = "normal";
      const watchController = createWatchController({
        isWatchMode: () => mode === "watch",
        setMode: (nextMode): void => {
          mode = nextMode;
        },
        getActionSequence: (_, fallback) => fallback
      });

      const video = document.getElementById("video") as HTMLVideoElement;
      setVideoRect(video, 0);

      let didRequestFullscreen = false;
      video.requestFullscreen = () => {
        didRequestFullscreen = true;
        return Promise.resolve();
      };

      expect(watchController.toggleVideoControls()).toBe(true);
      setVideoRect(video, window.innerHeight + 200);

      expect(watchController.toggleFullscreen()).toBe(true);
      expect(didRequestFullscreen).toBe(true);
      expect(String(mode)).toBe("normal");
    } finally {
      fixture.cleanup();
    }
  });

  test("can enter watch mode when only an offscreen video is available", async () => {
    const fixture = createDomFixture("<video id='video'></video>");

    try {
      const { createWatchController } = await import("~/src/core/actions/watch-mode");
      let mode: "normal" | "watch" = "normal";
      const watchController = createWatchController({
        isWatchMode: () => mode === "watch",
        setMode: (nextMode): void => {
          mode = nextMode;
        },
        getActionSequence: (_, fallback) => fallback
      });

      const video = document.getElementById("video") as HTMLVideoElement;
      setVideoRect(video, window.innerHeight + 200);

      let didRequestFullscreen = false;
      video.requestFullscreen = () => {
        didRequestFullscreen = true;
        return Promise.resolve();
      };

      expect(watchController.toggleVideoControls()).toBe(true);
      expect(String(mode)).toBe("watch");
      expect(watchController.toggleFullscreen()).toBe(true);
      expect(didRequestFullscreen).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });
});