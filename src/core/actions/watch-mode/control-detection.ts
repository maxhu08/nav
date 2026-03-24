import { WATCH_HINTS_ID } from "~/src/core/utils/get-ui";
import type { SiteToggleControlKind } from "~/src/core/actions/watch-mode/shared";
import {
  getControlText,
  isLikelyCaptionsControl,
  isLikelyFullscreenControl,
  isLikelyLoopControl,
  isLikelyMuteControl
} from "~/src/core/actions/watch-mode/control-text";

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

  return !(
    bounds.bottom < 0 ||
    bounds.right < 0 ||
    bounds.top > window.innerHeight ||
    bounds.left > window.innerWidth
  );
};

const addContainerCandidate = (
  candidates: HTMLElement[],
  seenRoots: Set<HTMLElement>,
  candidate: HTMLElement | null
): void => {
  if (!candidate || seenRoots.has(candidate)) {
    return;
  }

  seenRoots.add(candidate);
  candidates.push(candidate);
};

const getContainerCandidates = (video: HTMLVideoElement): HTMLElement[] => {
  const containerCandidates: HTMLElement[] = [];
  const seenRoots = new Set<HTMLElement>();

  addContainerCandidate(containerCandidates, seenRoots, video.closest(".html5-video-player"));
  addContainerCandidate(containerCandidates, seenRoots, video.closest("[class*='player' i]"));
  addContainerCandidate(containerCandidates, seenRoots, video.closest("[id*='player' i]"));
  addContainerCandidate(containerCandidates, seenRoots, video.parentElement);

  let ancestor: HTMLElement | null = video.parentElement;
  for (let depth = 0; depth < 6 && ancestor; depth += 1) {
    addContainerCandidate(containerCandidates, seenRoots, ancestor);
    ancestor = ancestor.parentElement;
  }

  addContainerCandidate(containerCandidates, seenRoots, document.body);
  return containerCandidates;
};

const getControlSelectors = (kind: SiteToggleControlKind): string => {
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

  return controlSelectorsByKind[kind];
};

const isLikelyControlForKind = (kind: SiteToggleControlKind, candidate: HTMLElement): boolean => {
  if (kind === "fullscreen") {
    return isLikelyFullscreenControl(candidate);
  }

  if (kind === "mute") {
    return isLikelyMuteControl(candidate);
  }

  if (kind === "captions") {
    return isLikelyCaptionsControl(candidate);
  }

  return isLikelyLoopControl(candidate);
};

const getDistanceScore = (videoBounds: DOMRect, control: HTMLElement): number => {
  const bounds = control.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const leftCornerDistance = Math.hypot(centerX - videoBounds.left, centerY - videoBounds.bottom);
  const rightCornerDistance = Math.hypot(centerX - videoBounds.right, centerY - videoBounds.bottom);
  const minDistance = Math.min(leftCornerDistance, rightCornerDistance);
  return Math.max(0, 8 - minDistance / 90);
};

const scoreControlCandidate = (
  kind: SiteToggleControlKind,
  candidate: HTMLElement,
  videoBounds: DOMRect
): number => {
  const controlText = getControlText(candidate);
  let score = getDistanceScore(videoBounds, candidate);

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

  return score;
};

const pickBestControlCandidate = (
  kind: SiteToggleControlKind,
  candidates: HTMLElement[],
  videoBounds: DOMRect
): HTMLElement | null => {
  let bestControl: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const score = scoreControlCandidate(kind, candidate, videoBounds);
    if (score > bestScore) {
      bestScore = score;
      bestControl = candidate;
    }
  }

  return bestControl;
};

export const findSiteToggleControl = (
  video: HTMLVideoElement,
  kind: SiteToggleControlKind
): HTMLElement | null => {
  const selectors = getControlSelectors(kind);
  const videoBounds = video.getBoundingClientRect();
  const candidates: HTMLElement[] = [];

  for (const root of getContainerCandidates(video)) {
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

      if (!isLikelyControlForKind(kind, candidate)) {
        continue;
      }

      candidates.push(candidate);
    }
  }

  return pickBestControlCandidate(kind, candidates, videoBounds);
};