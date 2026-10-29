import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";
import {
  activateSiteKeybindIgnore,
  deactivateSiteKeybindIgnore
} from "~/src/core/utils/ignore-site-keybinds";
import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";
import { findSiteToggleControl, getVideoMutedState } from "~/src/core/actions/watch-mode/controls";
import { createWatchOverlayController } from "~/src/core/actions/watch-mode/overlay";
import { isVideoVisible, type WatchControllerDeps } from "~/src/core/actions/watch-mode/shared";
import {
  toggleWatchCaptionsState,
  toggleWatchLoopState,
  toggleWatchMuteState,
  toggleWatchPlayPauseState
} from "~/src/core/actions/watch-mode/toggles";
import { pickBestWatchVideo } from "~/src/core/actions/watch-mode/video-state";

const getWatchVideoSource = (video: HTMLVideoElement) => {
  // Prefer declared sources: currentSrc can still refer to the previous video during loading.
  return (
    video.srcObject ??
    (video.src ||
      Array.from(
        video.querySelectorAll<HTMLSourceElement>("source[src]"),
        (source) => source.src
      ).join("\n") ||
      video.currentSrc)
  );
};

export const createWatchController = (deps: WatchControllerDeps) => {
  let watchVideoElement: HTMLVideoElement | null = null;
  let watchVideoSource: ReturnType<typeof getWatchVideoSource> = "";
  let watchRouteKey = window.location.href;
  let speedState: {
    video: HTMLVideoElement;
    source: ReturnType<typeof getWatchVideoSource>;
  } | null = null;
  const captionsStateByVideo = new WeakMap<HTMLVideoElement, boolean>();
  let lastWatchToastMessage = "";
  let lastWatchToastAt = 0;
  const WATCH_TOGGLE_TOAST_DEDUPE_WINDOW_MS = 450;

  const overlay = createWatchOverlayController({
    getActionSequence: deps.getActionSequence,
    getVideoMutedState
  });

  const showWatchActivationIndicator = (video: HTMLVideoElement): void => {
    window.dispatchEvent(
      new CustomEvent(FOCUS_INDICATOR_EVENT, {
        detail: { element: video }
      })
    );
  };

  const syncWatchVideoSpeed = (video: HTMLVideoElement | null): void => {
    if (!speedState || !video) {
      return;
    }

    const source = getWatchVideoSource(video);
    // Players can temporarily clear their source between loads.
    if (video === speedState.video && !source) {
      return;
    }

    const changed =
      video !== speedState.video || (speedState.source !== "" && source !== speedState.source);
    speedState = { video, source };
    if (changed) {
      video.playbackRate = 1;
    }
  };

  const getTrackedWatchVideo = (): HTMLVideoElement | null => {
    if (watchVideoElement && watchVideoElement.isConnected) {
      return watchVideoElement;
    }

    watchVideoElement = null;
    return null;
  };

  const refreshWatchRouteKey = (): boolean => {
    const nextRouteKey = window.location.href;
    if (nextRouteKey === watchRouteKey) {
      return false;
    }

    watchRouteKey = nextRouteKey;
    return true;
  };

  const exitWatchMode = (): void => {
    deps.setMode("normal");
    watchVideoElement = null;
    watchVideoSource = "";
    deactivateSiteKeybindIgnore("watch");
    overlay.hideOverlay();
  };

  const getActiveWatchVideo = (): HTMLVideoElement | null => {
    if (!deps.isWatchMode()) {
      return null;
    }

    const video = refreshWatchRouteKey() ? pickBestWatchVideo(null, true) : getTrackedWatchVideo();
    if (!video) {
      exitWatchMode();
      return null;
    }

    syncWatchVideoSpeed(video);
    const source = getWatchVideoSource(video);
    if (
      video !== watchVideoElement ||
      (source !== "" && watchVideoSource !== "" && source !== watchVideoSource)
    ) {
      exitWatchMode();
      return null;
    }

    if (source !== "") {
      watchVideoSource = source;
    }
    return video;
  };

  const showWatchToggleToast = (message: string): void => {
    const now = performance.now();
    if (
      message === lastWatchToastMessage &&
      now - lastWatchToastAt <= WATCH_TOGGLE_TOAST_DEDUPE_WINDOW_MS
    ) {
      return;
    }

    lastWatchToastMessage = message;
    lastWatchToastAt = now;
    ensureToastWrapper();
    const toast = getToastApi();
    toast?.info(message);
  };

  const syncWatchHintsOverlay = (): void => {
    const video = getActiveWatchVideo();

    if (!video || !isVideoVisible(video)) {
      overlay.hideOverlay();
      return;
    }

    overlay.showOverlay(video);
  };

  const syncWatchMediaState = (): void => {
    if (deps.isWatchMode()) {
      syncWatchHintsOverlay();
    }

    if (!deps.isWatchMode() && speedState) {
      syncWatchVideoSpeed(pickBestWatchVideo(null, true));
    }
  };

  const toggleDeps = {
    getVideo: getActiveWatchVideo,
    showActivationIndicator: showWatchActivationIndicator,
    exitWatchMode,
    showToast: showWatchToggleToast,
    captionsStateByVideo
  };

  const changeSpeed = (amount: number): boolean => {
    const video = getActiveWatchVideo();
    if (!video) {
      return false;
    }

    speedState = { video, source: getWatchVideoSource(video) };
    video.playbackRate = Math.min(16, Math.max(0.25, video.playbackRate + amount));
    syncWatchHintsOverlay();
    return true;
  };

  return {
    syncWatchHintsOverlay,
    handleWatchMediaStateChange: syncWatchMediaState,
    handleWatchRouteChange: (): void => {
      if (!deps.isWatchMode()) {
        watchRouteKey = window.location.href;
      }

      syncWatchMediaState();
    },
    handleWatchDomMutation: syncWatchMediaState,
    getWatchActionSequences: (): Record<
      | "toggle-fullscreen"
      | "toggle-play-pause"
      | "toggle-loop"
      | "toggle-mute"
      | "toggle-captions"
      | "decrease-speed"
      | "increase-speed",
      string
    > => ({
      "toggle-fullscreen": deps.getActionSequence("toggle-fullscreen", "f"),
      "toggle-play-pause": deps.getActionSequence("toggle-play-pause", "e"),
      "toggle-loop": deps.getActionSequence("toggle-loop", "l"),
      "toggle-mute": deps.getActionSequence("toggle-mute", "m"),
      "toggle-captions": deps.getActionSequence("toggle-captions", "c"),
      "decrease-speed": deps.getActionSequence("decrease-speed", "j"),
      "increase-speed": deps.getActionSequence("increase-speed", "k")
    }),
    isWatchModeActive: (): boolean => getActiveWatchVideo() !== null,
    exitWatchMode,
    decreaseSpeed: (): boolean => changeSpeed(-0.25),
    increaseSpeed: (): boolean => changeSpeed(0.25),
    toggleVideoControls: (): boolean => {
      const currentVideo = getActiveWatchVideo();
      const targetVideo = pickBestWatchVideo(null, true);

      if (deps.isWatchMode() && currentVideo && (!targetVideo || currentVideo === targetVideo)) {
        exitWatchMode();
        return true;
      }

      if (!targetVideo) {
        return false;
      }

      watchVideoElement = targetVideo;
      watchVideoSource = getWatchVideoSource(targetVideo);
      watchRouteKey = window.location.href;
      deps.setMode("watch");
      activateSiteKeybindIgnore("watch");
      targetVideo.focus({ preventScroll: true });
      syncWatchHintsOverlay();
      return true;
    },
    toggleWatchPlayPause: (): boolean => {
      return toggleWatchPlayPauseState(toggleDeps, { exitAfterToggle: true });
    },
    toggleWatchLoop: (): boolean => {
      return toggleWatchLoopState(toggleDeps, {
        exitAfterToggle: true,
        toastOnStateChange: true
      });
    },
    toggleWatchMute: (): boolean => {
      return toggleWatchMuteState(toggleDeps, {
        exitAfterToggle: true,
        toastOnStateChange: true
      });
    },
    toggleWatchCaptions: (): boolean => {
      return toggleWatchCaptionsState(toggleDeps, {
        exitAfterToggle: true,
        toastOnStateChange: true
      });
    },
    togglePlayPause: (): boolean => {
      return toggleWatchPlayPauseState(toggleDeps);
    },
    toggleFullscreen: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);

      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
        exitWatchMode();
        return true;
      }

      const siteFullscreenControl = findSiteToggleControl(video, "fullscreen");
      if (siteFullscreenControl) {
        siteFullscreenControl.click();
        exitWatchMode();
        return true;
      }

      if (typeof video.requestFullscreen !== "function") {
        return false;
      }

      void video.requestFullscreen().catch(() => {});
      exitWatchMode();
      return true;
    },
    toggleLoop: (): boolean => {
      return toggleWatchLoopState(toggleDeps);
    },
    toggleMute: (): boolean => {
      return toggleWatchMuteState(toggleDeps);
    },
    toggleCaptions: (): boolean => {
      return toggleWatchCaptionsState(toggleDeps);
    }
  };
};