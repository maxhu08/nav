import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";
import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";
import {
  findSiteToggleControl,
  getCaptionsState,
  getResolvedCaptionsState,
  getVideoMutedState,
  setInternalCaptionsState,
  toggleMuteWithFallback
} from "~/src/core/actions/watch-mode/controls";
import { createWatchOverlayController } from "~/src/core/actions/watch-mode/overlay";
import { isVideoVisible, type WatchControllerDeps } from "~/src/core/actions/watch-mode/shared";
import {
  getToggleableTextTracks,
  pickBestWatchVideo,
  toggleWatchVideoTextTracks
} from "~/src/core/actions/watch-mode/video-state";

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
      targetVideo.focus({ preventScroll: true });
      syncWatchHintsOverlay();
      return true;
    },
    toggleWatchPlayPause: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);

      if (video.paused || video.ended) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }

      exitWatchMode();
      return true;
    },
    toggleWatchLoop: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const wasLooping = video.loop;
      const siteLoopControl = findSiteToggleControl(video, "loop");
      if (siteLoopControl) {
        siteLoopControl.click();
      } else {
        video.loop = !video.loop;
      }

      const isLooping = siteLoopControl
        ? video.loop === wasLooping
          ? !wasLooping
          : video.loop
        : video.loop;
      showWatchToggleToast(isLooping ? "Loop on" : "Loop off");
      exitWatchMode();
      return true;
    },
    toggleWatchMute: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const isMuted = toggleMuteWithFallback(video);
      showWatchToggleToast(isMuted ? "Video muted" : "Video unmuted");
      exitWatchMode();
      return true;
    },
    toggleWatchCaptions: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const siteCaptionsControl = findSiteToggleControl(video, "captions");
      const hadTracks = getToggleableTextTracks(video).length > 0;
      const wasCaptionsOn = getResolvedCaptionsState(
        video,
        siteCaptionsControl,
        captionsStateByVideo
      );
      if (siteCaptionsControl) {
        siteCaptionsControl.click();
      } else if (!toggleWatchVideoTextTracks(video)) {
        showWatchToggleToast("Captions unavailable");
        exitWatchMode();
        return true;
      }

      let captionsOn = getCaptionsState(video, siteCaptionsControl);
      if (captionsOn === null || captionsOn === wasCaptionsOn) {
        if (!siteCaptionsControl && hadTracks && toggleWatchVideoTextTracks(video)) {
          captionsOn = getToggleableTextTracks(video).some((track) => track.mode === "showing");
        } else {
          captionsOn = !wasCaptionsOn;
        }
      }

      setInternalCaptionsState(captionsStateByVideo, video, captionsOn);
      showWatchToggleToast(captionsOn ? "Captions on" : "Captions off");
      exitWatchMode();
      return true;
    },
    togglePlayPause: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);

      if (video.paused || video.ended) {
        void video.play().catch(() => {});
        return true;
      }

      video.pause();
      return true;
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
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const wasLooping = video.loop;
      const siteLoopControl = findSiteToggleControl(video, "loop");
      if (siteLoopControl) {
        siteLoopControl.click();
      } else {
        video.loop = !video.loop;
      }
      if (!siteLoopControl && video.loop === wasLooping) {
        video.loop = !video.loop;
      }
      return true;
    },
    toggleMute: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      toggleMuteWithFallback(video);
      return true;
    },
    toggleCaptions: (): boolean => {
      const video = getActiveWatchVideo();
      if (!video) {
        return false;
      }

      showWatchActivationIndicator(video);
      const siteCaptionsControl = findSiteToggleControl(video, "captions");
      const hadTracks = getToggleableTextTracks(video).length > 0;
      if (siteCaptionsControl) {
        const currentState = getResolvedCaptionsState(
          video,
          siteCaptionsControl,
          captionsStateByVideo
        );
        setInternalCaptionsState(captionsStateByVideo, video, !currentState);
        siteCaptionsControl.click();
        return true;
      }

      if (!hadTracks) {
        return false;
      }

      return toggleWatchVideoTextTracks(video);
    }
  };
};