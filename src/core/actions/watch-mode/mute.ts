import { findSiteToggleControl } from "~/src/core/actions/watch-mode/control-detection";
import {
  getMuteStateFromControl,
  getVideoMutedState
} from "~/src/core/actions/watch-mode/control-state";

const triggerMuteControlWithKeyboard = (control: HTMLElement): void => {
  control.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  control.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
};

export const toggleMuteWithFallback = (video: HTMLVideoElement): boolean => {
  const siteMuteControl = findSiteToggleControl(video, "mute");
  const wasMuted = getMuteStateFromControl(video, siteMuteControl);

  if (siteMuteControl) {
    siteMuteControl.click();
    let muteStateAfterTrigger = getMuteStateFromControl(video, siteMuteControl);
    if (muteStateAfterTrigger !== wasMuted) {
      return muteStateAfterTrigger;
    }

    triggerMuteControlWithKeyboard(siteMuteControl);
    muteStateAfterTrigger = getMuteStateFromControl(video, siteMuteControl);
    if (muteStateAfterTrigger !== wasMuted) {
      return muteStateAfterTrigger;
    }
  }

  video.muted = !wasMuted;
  if (video.muted === wasMuted) {
    video.muted = !video.muted;
  }

  return getVideoMutedState(video);
};