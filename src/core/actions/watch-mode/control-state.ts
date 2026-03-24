import { getToggleableTextTracks } from "~/src/core/actions/watch-mode/video-state";
import {
  getCaptionsStateFromLabel,
  getControlPressedState,
  hasEnabledClassState
} from "~/src/core/actions/watch-mode/toggle-state";
import { getControlText } from "~/src/core/actions/watch-mode/control-text";

const getCaptionsStateFromControl = (control: HTMLElement | null): boolean | null => {
  if (!control) {
    return null;
  }

  const pressedState = getControlPressedState(control);
  if (pressedState !== null) {
    return pressedState;
  }

  const fromLabel = getCaptionsStateFromLabel(getControlText(control));
  if (fromLabel !== null) {
    return fromLabel;
  }

  return hasEnabledClassState(control, [/\benabled\b/, /\bactive\b/, /\bon\b/, /\bselected\b/]);
};

export const getCaptionsState = (
  video: HTMLVideoElement,
  control: HTMLElement | null
): boolean | null => {
  const controlState = getCaptionsStateFromControl(control);
  if (controlState !== null) {
    return controlState;
  }

  const tracks = getToggleableTextTracks(video);
  return tracks.length > 0 ? tracks.some((track) => track.mode === "showing") : null;
};

export const getResolvedCaptionsState = (
  video: HTMLVideoElement,
  control: HTMLElement | null,
  captionsStateByVideo: WeakMap<HTMLVideoElement, boolean>
): boolean => {
  const detectedState = getCaptionsState(video, control);
  if (detectedState !== null) {
    captionsStateByVideo.set(video, detectedState);
    return detectedState;
  }

  const cachedState = captionsStateByVideo.get(video);
  return typeof cachedState === "boolean" ? cachedState : false;
};

export const setInternalCaptionsState = (
  captionsStateByVideo: WeakMap<HTMLVideoElement, boolean>,
  video: HTMLVideoElement,
  value: boolean
): void => {
  captionsStateByVideo.set(video, value);
};

export const getVideoMutedState = (video: HTMLVideoElement): boolean => {
  return video.muted || video.volume <= 0;
};

export const getMuteStateFromControl = (
  video: HTMLVideoElement,
  control: HTMLElement | null
): boolean => {
  if (!control) {
    return getVideoMutedState(video);
  }

  const pressedState = getControlPressedState(control);
  if (pressedState !== null) {
    return pressedState;
  }

  const classState = hasEnabledClassState(control, [
    /\bmuted\b/,
    /\bactive\b/,
    /\benabled\b/,
    /\bon\b/
  ]);
  if (classState !== null) {
    return classState;
  }

  const text = getControlText(control);
  if (/\bunmute\b/.test(text)) {
    return true;
  }
  if (/\bmute\b/.test(text)) {
    return false;
  }

  return getVideoMutedState(video);
};