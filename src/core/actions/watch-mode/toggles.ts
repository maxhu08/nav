import {
  findSiteToggleControl,
  getCaptionsState,
  getResolvedCaptionsState,
  setInternalCaptionsState,
  toggleMuteWithFallback
} from "~/src/core/actions/watch-mode/controls";
import {
  getToggleableTextTracks,
  toggleWatchVideoTextTracks
} from "~/src/core/actions/watch-mode/video-state";

type ToggleDeps = {
  getVideo: () => HTMLVideoElement | null;
  showActivationIndicator: (video: HTMLVideoElement) => void;
  exitWatchMode: () => void;
  showToast?: (message: string) => void;
  captionsStateByVideo: WeakMap<HTMLVideoElement, boolean>;
};

type ToggleOptions = {
  exitAfterToggle?: boolean;
  toastOnStateChange?: boolean;
};

const maybeExitWatchMode = (options: ToggleOptions, exitWatchMode: () => void): void => {
  if (options.exitAfterToggle) {
    exitWatchMode();
  }
};

export const toggleWatchPlayPauseState = (
  deps: ToggleDeps,
  options: ToggleOptions = {}
): boolean => {
  const video = deps.getVideo();
  if (!video) {
    return false;
  }

  deps.showActivationIndicator(video);
  if (video.paused || video.ended) {
    void video.play().catch(() => {});
  } else {
    video.pause();
  }

  maybeExitWatchMode(options, deps.exitWatchMode);
  return true;
};

export const toggleWatchLoopState = (deps: ToggleDeps, options: ToggleOptions = {}): boolean => {
  const video = deps.getVideo();
  if (!video) {
    return false;
  }

  deps.showActivationIndicator(video);
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

  const isLooping = siteLoopControl
    ? video.loop === wasLooping
      ? !wasLooping
      : video.loop
    : video.loop;
  if (options.toastOnStateChange) {
    deps.showToast?.(isLooping ? "Loop on" : "Loop off");
  }

  maybeExitWatchMode(options, deps.exitWatchMode);
  return true;
};

export const toggleWatchMuteState = (deps: ToggleDeps, options: ToggleOptions = {}): boolean => {
  const video = deps.getVideo();
  if (!video) {
    return false;
  }

  deps.showActivationIndicator(video);
  const isMuted = toggleMuteWithFallback(video);
  if (options.toastOnStateChange) {
    deps.showToast?.(isMuted ? "Video muted" : "Video unmuted");
  }

  maybeExitWatchMode(options, deps.exitWatchMode);
  return true;
};

export const toggleWatchCaptionsState = (
  deps: ToggleDeps,
  options: ToggleOptions = {}
): boolean => {
  const video = deps.getVideo();
  if (!video) {
    return false;
  }

  deps.showActivationIndicator(video);
  const siteCaptionsControl = findSiteToggleControl(video, "captions");
  const hadTracks = getToggleableTextTracks(video).length > 0;
  const wasCaptionsOn = getResolvedCaptionsState(
    video,
    siteCaptionsControl,
    deps.captionsStateByVideo
  );
  let didToggleTracksDirectly = false;

  if (siteCaptionsControl) {
    const currentState = getResolvedCaptionsState(
      video,
      siteCaptionsControl,
      deps.captionsStateByVideo
    );
    setInternalCaptionsState(deps.captionsStateByVideo, video, !currentState);
    siteCaptionsControl.click();

    if (!options.toastOnStateChange) {
      return true;
    }
  } else if (!hadTracks) {
    if (options.toastOnStateChange) {
      deps.showToast?.("Captions unavailable");
      maybeExitWatchMode(options, deps.exitWatchMode);
      return true;
    }

    return false;
  } else if (!toggleWatchVideoTextTracks(video)) {
    if (options.toastOnStateChange) {
      deps.showToast?.("Captions unavailable");
      maybeExitWatchMode(options, deps.exitWatchMode);
      return true;
    }

    return false;
  } else {
    didToggleTracksDirectly = true;
  }

  let captionsOn = getCaptionsState(video, siteCaptionsControl);
  if (captionsOn === null || captionsOn === wasCaptionsOn) {
    if (!siteCaptionsControl && didToggleTracksDirectly) {
      captionsOn = getToggleableTextTracks(video).some((track) => track.mode === "showing");
    } else {
      captionsOn = !wasCaptionsOn;
    }
  }

  if (captionsOn === null) {
    captionsOn = !wasCaptionsOn;
  }

  setInternalCaptionsState(deps.captionsStateByVideo, video, captionsOn);
  if (options.toastOnStateChange) {
    deps.showToast?.(captionsOn ? "Captions on" : "Captions off");
  }

  maybeExitWatchMode(options, deps.exitWatchMode);
  return true;
};