import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

export const isYouTubeHintContext = (): boolean => {
  if (/(^|\.)youtube\.com$/i.test(window.location.hostname)) {
    return true;
  }

  return (
    document.querySelector("ytd-masthead") instanceof HTMLElement ||
    document.querySelector("ytd-topbar-logo-renderer#logo") instanceof HTMLElement ||
    document.querySelector(".ytp-fullscreen-quick-actions") instanceof HTMLElement
  );
};

const isYouTubeTopbarLogoTarget = (element: HTMLElement): boolean => {
  if (
    !(element instanceof HTMLAnchorElement) ||
    !element.closest("ytd-topbar-logo-renderer#logo")
  ) {
    return false;
  }

  try {
    return new URL(element.href, window.location.href).pathname === "/";
  } catch {
    return false;
  }
};

const isYouTubeMastheadStartTarget = (element: HTMLElement): boolean => {
  if (!element.closest("ytd-masthead #start")) {
    return false;
  }

  return (
    element.matches("button[aria-label='Back']") ||
    element.matches("button[aria-label='Guide']") ||
    isYouTubeTopbarLogoTarget(element)
  );
};

const isYouTubeMastheadEndTarget = (element: HTMLElement): boolean => {
  if (!element.closest("ytd-masthead #end")) {
    return false;
  }

  return (
    (element.matches("button[aria-label='Notifications']") &&
      !!element.closest("ytd-notification-topbar-button-renderer")) ||
    (element.matches("button#avatar-btn[aria-label='Account menu']") &&
      !!element.closest("ytd-topbar-menu-button-renderer"))
  );
};

const isYouTubeFullscreenQuickActionTarget = (element: HTMLElement): boolean => {
  if (!element.closest(".ytp-fullscreen-quick-actions")) {
    return false;
  }

  return element.matches("button");
};

export const getYouTubeSpecialRowKey = (target: HintTarget): string | null => {
  if (isYouTubeFullscreenQuickActionTarget(target.element)) {
    return "youtube-fullscreen-quick-actions";
  }

  if (isYouTubeMastheadStartTarget(target.element)) {
    return "youtube-masthead-start";
  }

  if (isYouTubeMastheadEndTarget(target.element)) {
    return "youtube-masthead-end";
  }

  return null;
};