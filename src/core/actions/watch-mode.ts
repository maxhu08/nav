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

export const createWatchController = (deps: WatchControllerDeps) => {
  let watchVideoElement: HTMLVideoElement | null = null;
  let watchRouteKey = window.location.href;
  let isWaitingForWatchVideoRefresh = false;
  let watchShowCapitalizedLetters = false;
  const captionsStateByVideo = new WeakMap<HTMLVideoElement, boolean>();
  let lastWatchToastMessage = "";
  let lastWatchToastAt = 0;
  const WATCH_TOGGLE_TOAST_DEDUPE_WINDOW_MS = 450;

  const overlay = createWatchOverlayController({
    getActionSequence: deps.getActionSequence,
    getShowCapitalizedLetters: () => watchShowCapitalizedLetters,
    getVideoMutedState
  });

  const showWatchActivationIndicator = (video: HTMLVideoElement): void => {
    window.dispatchEvent(
      new CustomEvent(FOCUS_INDICATOR_EVENT, {
        detail: { element: video }
      })
    );
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
    watchVideoElement = null;
    isWaitingForWatchVideoRefresh = true;
    return true;
  };

  const reacquireWatchVideo = (): HTMLVideoElement | null => {
    const nextVideo = pickBestWatchVideo(null);
    if (!nextVideo) {
      return null;
    }

    watchVideoElement = nextVideo;
    isWaitingForWatchVideoRefresh = false;
    return nextVideo;
  };

  const exitWatchMode = (): void => {
    deps.setMode("normal");
    isWaitingForWatchVideoRefresh = false;
    deactivateSiteKeybindIgnore("watch");
    overlay.hideOverlay();
  };

  const getActiveWatchVideo = (): HTMLVideoElement | null => {
    if (!deps.isWatchMode()) {
      return null;
    }

    refreshWatchRouteKey();

    if (isWaitingForWatchVideoRefresh) {
      return reacquireWatchVideo();
    }

    const trackedVideo = getTrackedWatchVideo();
    if (trackedVideo) {
      return trackedVideo;
    }

    exitWatchMode();
    return null;
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

  const toggleDeps = {
    getVideo: getActiveWatchVideo,
    showActivationIndicator: showWatchActivationIndicator,
    exitWatchMode,
    showToast: showWatchToggleToast,
    captionsStateByVideo
  };

  return {
    setWatchShowCapitalizedLetters: (value: boolean): void => {
      watchShowCapitalizedLetters = value;
      overlay.invalidateRender();
    },
    syncWatchHintsOverlay,
    handleWatchMediaStateChange: (): void => {
      if (!deps.isWatchMode()) {
        return;
      }

      syncWatchHintsOverlay();
    },
    handleWatchRouteChange: (): void => {
      if (!deps.isWatchMode()) {
        watchRouteKey = window.location.href;
        return;
      }

      refreshWatchRouteKey();
      syncWatchHintsOverlay();
    },
    handleWatchDomMutation: (): void => {
      if (!deps.isWatchMode() || !isWaitingForWatchVideoRefresh) {
        return;
      }

      syncWatchHintsOverlay();
    },
    getWatchActionSequences: (): Record<
      "toggle-fullscreen" | "toggle-play-pause" | "toggle-loop" | "toggle-mute" | "toggle-captions",
      string
    > => ({
      "toggle-fullscreen": deps.getActionSequence("toggle-fullscreen", "f"),
      "toggle-play-pause": deps.getActionSequence("toggle-play-pause", "e"),
      "toggle-loop": deps.getActionSequence("toggle-loop", "l"),
      "toggle-mute": deps.getActionSequence("toggle-mute", "m"),
      "toggle-captions": deps.getActionSequence("toggle-captions", "c")
    }),
    isWatchModeActive: (): boolean => getActiveWatchVideo() !== null,
    exitWatchMode,
    toggleVideoControls: (): boolean => {
      const currentVideo = getActiveWatchVideo();
      const targetVideo = pickBestWatchVideo(null);

      if (deps.isWatchMode() && currentVideo && currentVideo === targetVideo) {
        exitWatchMode();
        return true;
      }

      if (!targetVideo) {
        return false;
      }

      watchVideoElement = targetVideo;
      watchRouteKey = window.location.href;
      isWaitingForWatchVideoRefresh = false;
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