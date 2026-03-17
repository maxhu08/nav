import { WATCH_HINTS_ID } from "~/src/core/utils/get-ui";
import type { SiteToggleControlKind } from "~/src/core/actions/watch-mode/shared";
import { getToggleableTextTracks } from "~/src/core/actions/watch-mode/video-state";
import {
  getCaptionsStateFromLabel,
  getControlPressedState,
  hasEnabledClassState
} from "~/src/core/actions/watch-mode/toggle-state";

const CONTROL_TEXT_ATTRIBUTES = [
  "aria-label",
  "title",
  "name",
  "id",
  "class",
  "data-testid",
  "data-test-id",
  "data-icon",
  "data-title-no-tooltip",
  "data-tooltip-target-id"
] as const;

const isInteractiveControl = (element: HTMLElement): boolean => {
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
    return false;
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return !element.disabled;
  }

  if (element.tagName.toLowerCase() === "summary") {
    return true;
  }

  if (element instanceof HTMLInputElement) {
    return !element.disabled && element.type.toLowerCase() !== "hidden";
  }

  if (element instanceof HTMLAnchorElement) {
    return !!element.href;
  }

  const role = element.getAttribute("role")?.toLowerCase();
  if (
    role &&
    ["button", "switch", "checkbox", "radio", "menuitem", "menuitemcheckbox"].includes(role)
  ) {
    return true;
  }

  if (element.hasAttribute("onclick") || element.hasAttribute("jsaction")) {
    return true;
  }

  const tabIndexValue = element.getAttribute("tabindex");
  if (tabIndexValue !== null) {
    const parsedTabIndex = Number.parseInt(tabIndexValue, 10);
    if (!Number.isNaN(parsedTabIndex) && parsedTabIndex >= 0) {
      return true;
    }
  }

  return false;
};

const getInteractiveControlTarget = (
  element: HTMLElement,
  root: HTMLElement
): HTMLElement | null => {
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    if (isInteractiveControl(current)) {
      return current;
    }
    current = current.parentElement;
  }

  if (current === root && isInteractiveControl(current)) {
    return current;
  }

  return null;
};

const isElementVisible = (element: HTMLElement): boolean => {
  const bounds = element.getBoundingClientRect();
  if (bounds.width < 1 || bounds.height < 1) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  if (styles.display === "none" || styles.visibility === "hidden" || styles.opacity === "0") {
    return false;
  }

  if (
    bounds.bottom < 0 ||
    bounds.right < 0 ||
    bounds.top > window.innerHeight ||
    bounds.left > window.innerWidth
  ) {
    return false;
  }

  return true;
};

const getControlText = (element: HTMLElement): string => {
  return [
    ...CONTROL_TEXT_ATTRIBUTES.map((attributeName) => element.getAttribute(attributeName)),
    element.textContent
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const isLikelyFullscreenControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);

  return (
    className.toLowerCase().includes("fullscreen") ||
    label.includes("fullscreen") ||
    label.includes("full screen") ||
    label.includes("exit fullscreen") ||
    label.includes("exit full screen")
  );
};

const isLikelyMuteControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);
  return (
    className.toLowerCase().includes("mute") ||
    className.toLowerCase().includes("volume") ||
    label.includes("mute") ||
    label.includes("unmute") ||
    label.includes("volume")
  );
};

const isLikelyCaptionsControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);
  return (
    className.toLowerCase().includes("caption") ||
    className.toLowerCase().includes("subtitle") ||
    label.includes("caption") ||
    label.includes("subtitles") ||
    label.includes("subtitle") ||
    label.includes("cc")
  );
};

const isLikelyLoopControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);
  return (
    className.toLowerCase().includes("loop") ||
    className.toLowerCase().includes("repeat") ||
    label.includes("loop") ||
    label.includes("repeat")
  );
};

export const findSiteToggleControl = (
  video: HTMLVideoElement,
  kind: SiteToggleControlKind
): HTMLElement | null => {
  const containerCandidates: HTMLElement[] = [];
  const seenRoots = new Set<HTMLElement>();

  const addContainerCandidate = (candidate: HTMLElement | null): void => {
    if (!candidate || seenRoots.has(candidate)) {
      return;
    }
    seenRoots.add(candidate);
    containerCandidates.push(candidate);
  };

  addContainerCandidate(video.closest(".html5-video-player"));
  addContainerCandidate(video.closest("[class*='player' i]"));
  addContainerCandidate(video.closest("[id*='player' i]"));
  addContainerCandidate(video.parentElement);

  let ancestor: HTMLElement | null = video.parentElement;
  for (let depth = 0; depth < 6 && ancestor; depth += 1) {
    addContainerCandidate(ancestor);
    ancestor = ancestor.parentElement;
  }

  addContainerCandidate(document.body);

  const controlSelectorsByKind: Record<SiteToggleControlKind, string> = {
    fullscreen: [
      "[aria-label*='fullscreen' i]",
      "[title*='fullscreen' i]",
      "[class*='fullscreen' i]",
      "[data-testid*='fullscreen' i]"
    ].join(", "),
    mute: [
      "[aria-label*='mute' i]",
      "[aria-label*='unmute' i]",
      "[title*='unmute' i]",
      "[title*='mute' i]",
      "[aria-label*='volume' i]",
      "[title*='volume' i]",
      "[name*='volume' i]",
      "[name*='mute' i]",
      "[class*='mute' i]",
      "[class*='volume' i]",
      "[id*='mute' i]",
      "[id*='volume' i]",
      "[data-testid*='mute' i]",
      "[data-testid*='volume' i]"
    ].join(", "),
    captions: [
      "[aria-label*='caption' i]",
      "[aria-label*='subtitle' i]",
      "[title*='caption' i]",
      "[title*='subtitle' i]",
      "[class*='caption' i]",
      "[class*='subtitle' i]",
      "[data-testid*='caption' i]",
      "[data-testid*='subtitle' i]"
    ].join(", "),
    loop: [
      "[aria-label*='loop' i]",
      "[aria-label*='repeat' i]",
      "[title*='loop' i]",
      "[title*='repeat' i]",
      "[class*='loop' i]",
      "[class*='repeat' i]",
      "[data-testid*='loop' i]",
      "[data-testid*='repeat' i]"
    ].join(", ")
  };
  const selectors = controlSelectorsByKind[kind];
  const videoBounds = video.getBoundingClientRect();
  const candidateScores = new Map<HTMLElement, number>();

  const getDistanceScore = (control: HTMLElement): number => {
    const bounds = control.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const leftCornerDistance = Math.hypot(centerX - videoBounds.left, centerY - videoBounds.bottom);
    const rightCornerDistance = Math.hypot(
      centerX - videoBounds.right,
      centerY - videoBounds.bottom
    );
    const minDistance = Math.min(leftCornerDistance, rightCornerDistance);
    return Math.max(0, 8 - minDistance / 90);
  };

  for (const root of containerCandidates) {
    const controls = Array.from(root.querySelectorAll(selectors)).filter(
      (element): element is HTMLElement => element instanceof HTMLElement
    );

    for (const control of controls) {
      const candidate = getInteractiveControlTarget(control, root);
      if (!candidate || candidate.closest(`#${WATCH_HINTS_ID}`)) {
        continue;
      }

      if (!isElementVisible(candidate)) {
        continue;
      }

      if (
        kind === "mute" &&
        (candidate.getAttribute("role")?.toLowerCase() === "slider" ||
          (candidate instanceof HTMLInputElement && candidate.type.toLowerCase() === "range"))
      ) {
        continue;
      }

      const isLikelyControl =
        kind === "fullscreen"
          ? isLikelyFullscreenControl(candidate)
          : kind === "mute"
            ? isLikelyMuteControl(candidate)
            : kind === "captions"
              ? isLikelyCaptionsControl(candidate)
              : isLikelyLoopControl(candidate);
      if (!isLikelyControl) {
        continue;
      }

      const controlText = getControlText(candidate);
      let score = getDistanceScore(candidate);

      if (kind === "mute") {
        if (/\b(mute|unmute|volume|sound|speaker|audio)\b/.test(controlText)) {
          score += 18;
        }
        if (/\b(slider|seek|scrub|timeline|progress|bar|knob)\b/.test(controlText)) {
          score -= 20;
        }
      }

      if (kind === "fullscreen" && /\b(fullscreen|full screen)\b/.test(controlText)) {
        score += 16;
      }
      if (kind === "captions" && /\b(cc|caption|captions|subtitle|subtitles)\b/.test(controlText)) {
        score += 16;
      }
      if (kind === "loop" && /\b(loop|repeat)\b/.test(controlText)) {
        score += 16;
      }

      if (candidate.hasAttribute("aria-pressed") || candidate.hasAttribute("aria-checked")) {
        score += 3;
      }

      const currentBestScore = candidateScores.get(candidate) ?? Number.NEGATIVE_INFINITY;
      if (score > currentBestScore) {
        candidateScores.set(candidate, score);
      }
    }
  }

  let bestControl: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const [control, score] of candidateScores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestControl = control;
    }
  }

  return bestControl;
};

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
  if (tracks.length > 0) {
    return tracks.some((track) => track.mode === "showing");
  }

  return null;
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

const getMuteStateFromControl = (video: HTMLVideoElement, control: HTMLElement | null): boolean => {
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