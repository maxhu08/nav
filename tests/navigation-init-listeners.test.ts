import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { createWatchController } from "~/src/core/actions/watch-mode";
import { registerRuntimeListeners } from "~/src/core/navigation/init-listeners";
import { WATCH_HINTS_ID } from "~/src/core/utils/get-ui";
import { resetSiteKeybindIgnoreForTests } from "~/src/core/utils/ignore-site-keybinds";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("watch runtime listeners", () => {
  let fixture: ReturnType<typeof createDomFixture>;
  let controller: ReturnType<typeof createWatchController>;
  let video: HTMLVideoElement;
  let descriptor: PropertyDescriptor | undefined;
  let observers: MutationObserver[];

  beforeEach(async () => {
    fixture = createDomFixture("<video src='/first.mp4'></video>");
    descriptor = Object.getOwnPropertyDescriptor(globalThis, "MutationObserver");
    observers = [];
    Object.defineProperty(globalThis, "MutationObserver", {
      configurable: true,
      value: class extends window.MutationObserver {
        constructor(callback: MutationCallback) {
          super(callback);
          observers.push(this);
        }
      }
    });
    let mode: "normal" | "watch" = "normal";
    const module = await import("~/src/core/actions/watch-mode");
    controller = module.createWatchController({
      isWatchMode: () => mode === "watch",
      setMode: (value) => {
        mode = value;
      },
      getActionSequence: (_, fallback) => fallback
    });
    video = document.querySelector("video")!;
    video.getBoundingClientRect = () => new DOMRect(0, 0, 640, 360);
    registerRuntimeListeners({
      focusIndicator: {
        syncStyles: () => {},
        ensureOverlay: () => {},
        handleFocusIndicatorEvent: () => {},
        handleEditableBeforeInput: () => {},
        scheduleOverlayPosition: () => {}
      },
      findMode: { ensureFindUI: () => {}, hideFindBar: () => {} },
      watchController: controller
    });
    controller.toggleVideoControls();
    controller.increaseSpeed();
    await Promise.resolve();
  });

  afterEach(() => {
    observers.forEach((observer) => observer.disconnect());
    if (descriptor) Object.defineProperty(globalThis, "MutationObserver", descriptor);
    else Reflect.deleteProperty(globalThis, "MutationObserver");
    resetSiteKeybindIgnoreForTests();
    fixture.cleanup();
  });

  for (const event of ["loadstart", "loadedmetadata", "playing"]) {
    test(`detects a currentSrc-only change through a non-bubbling ${event} event`, () => {
      video.removeAttribute("src");
      Object.defineProperty(video, "currentSrc", { value: "https://example.com/second.mp4" });
      controller.exitWatchMode();
      video.dispatchEvent(new window.Event(event));
      expect(video.playbackRate).toBe(1);
    });
  }

  test("observes source attributes on a reused SPA player without media events", async () => {
    history.pushState({}, "", "/watch/second");
    expect(video.playbackRate).toBe(1.25);
    video.src = "/second.mp4";
    await Promise.resolve();
    expect(video.playbackRate).toBe(1);
    expect(controller.isWatchModeActive()).toBe(false);
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("false");
  });

  test("observes nested source changes after leaving watch mode", async () => {
    video.removeAttribute("src");
    video.innerHTML = "<source src='/first.mp4'>";
    await Promise.resolve();
    controller.increaseSpeed();
    controller.exitWatchMode();
    video.querySelector("source")!.src = "/second.mp4";
    await Promise.resolve();
    expect(video.playbackRate).toBe(1);
  });

  test("handles a player inserted after SPA navigation without another URL change", async () => {
    history.pushState({}, "", "/watch/second");
    video.remove();
    await Promise.resolve();
    const next = document.createElement("video");
    next.src = "/second.mp4";
    next.playbackRate = 1.25;
    next.getBoundingClientRect = () => new DOMRect(0, 0, 640, 360);
    fixture.root.append(next);
    await Promise.resolve();
    expect(next.playbackRate).toBe(1);
    expect(controller.isWatchModeActive()).toBe(false);
    expect(document.getElementById(WATCH_HINTS_ID)?.getAttribute("data-visible")).toBe("false");
  });
});