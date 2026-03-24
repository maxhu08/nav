import { describe, expect, test } from "bun:test";
import {
  activateSiteKeybindIgnore,
  deactivateSiteKeybindIgnore,
  resetSiteKeybindIgnoreForTests
} from "~/src/core/utils/ignore-site-keybinds";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const setVideoRect = (video: HTMLVideoElement, top: number): void => {
  const rect = new DOMRect(0, top, 640, 360);
  video.getBoundingClientRect = (): DOMRect => rect;
};

describe("watch mode", () => {
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

  test("reacquires a new video after spa navigation", async () => {
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
});