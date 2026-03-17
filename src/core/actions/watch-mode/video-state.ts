import { getDeepActiveElement } from "~/src/core/utils/is-editable-target";
import { getVideoElementsFromRoot, isVideoVisible } from "~/src/core/actions/watch-mode/shared";

export const pickBestWatchVideo = (
  trackedVideo: HTMLVideoElement | null
): HTMLVideoElement | null => {
  if (trackedVideo && trackedVideo.isConnected) {
    return trackedVideo;
  }

  const activeElement = getDeepActiveElement();
  if (activeElement instanceof HTMLVideoElement && isVideoVisible(activeElement)) {
    return activeElement;
  }

  const visibleVideos = getVideoElementsFromRoot(document).filter(
    (video): video is HTMLVideoElement => video instanceof HTMLVideoElement && isVideoVisible(video)
  );

  if (visibleVideos.length === 0) {
    return null;
  }

  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;
  const getVideoScore = (video: HTMLVideoElement): number => {
    const bounds = video.getBoundingClientRect();
    const areaScore = bounds.width * bounds.height;
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const centerDistance = Math.hypot(centerX - viewportCenterX, centerY - viewportCenterY);
    const centerScore = Math.max(0, 20000 - centerDistance * 60);
    const playingScore = !video.paused && !video.ended ? 1_000_000_000 : 0;
    return playingScore + areaScore + centerScore;
  };

  const rankedVideos = [...visibleVideos].sort(
    (left, right) => getVideoScore(right) - getVideoScore(left)
  );
  return rankedVideos[0] ?? null;
};

export const getToggleableTextTracks = (video: HTMLVideoElement): TextTrack[] => {
  return Array.from(video.textTracks).filter((track) => track.kind !== "metadata");
};

export const toggleWatchVideoTextTracks = (video: HTMLVideoElement): boolean => {
  const tracks = getToggleableTextTracks(video);
  if (tracks.length === 0) {
    return false;
  }

  const hasVisibleTrack = tracks.some((track) => track.mode === "showing");

  for (const track of tracks) {
    track.mode = hasVisibleTrack ? "disabled" : "showing";
  }

  return true;
};