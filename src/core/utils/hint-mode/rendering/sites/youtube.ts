import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";

const isYouTubeMastheadStartTarget = (element: HTMLElement): boolean => {
  if (!element.closest("ytd-masthead #start")) {
    return false;
  }

  return (
    element.matches("button[aria-label='Back']") ||
    element.matches("button[aria-label='Guide']") ||
    (element.matches("a#logo[href='/']") &&
      element.matches("[title='YouTube Home']") &&
      !!element.closest("ytd-topbar-logo-renderer#logo"))
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

export const getYouTubeSpecialRowKey = (target: HintTarget): string | null => {
  if (isYouTubeMastheadStartTarget(target.element)) {
    return "youtube-masthead-start";
  }

  if (isYouTubeMastheadEndTarget(target.element)) {
    return "youtube-masthead-end";
  }

  return null;
};