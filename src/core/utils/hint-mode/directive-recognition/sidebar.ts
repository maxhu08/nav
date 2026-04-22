import {
  getAncestorDescriptorText,
  getElementTextValues,
  getJoinedElementText,
  getPatternScore
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const SIDEBAR_TOKEN_PATTERN =
  /\b(sidebar|side\s*bar|navigation|nav(?:igation)?|drawer|rail|panel)\b/i;
const SIDEBAR_ACTION_PATTERN = /\b(toggle|open|close|collapse|expand|show|hide)\b/i;
const GUIDE_TOKEN_PATTERN = /\bguide\b/i;
const SHELL_CONTEXT_PATTERN = /\b(masthead|topbar|app[-\s]?bar|header|chrome)\b/i;
const NON_SIDEBAR_MENU_PATTERN =
  /\b(action[-\s]?menu|actionlist|dropdown|popover|overlay|settings?|preferences?|contribution settings?)\b/i;
const SIDEBAR_ICON_PATTERN = /\b(three-bars|sidebar|hamburger|nav(?:igation)?|menu|x|close)\b/i;
const MAX_DIRECTIVE_SCORE = 9999;

const isYouTubeMastheadGuideButton = (element: HTMLElement): boolean => {
  if (element.matches("yt-icon-button#guide-button > button, #guide-button > button")) {
    return true;
  }

  return (
    element.getAttribute("aria-label")?.trim().toLowerCase() === "guide" &&
    !!element.closest("yt-icon-button#guide-button, ytd-masthead #guide-button, #guide-button")
  );
};

const isYouTubeAskButton = (element: HTMLElement): boolean => {
  return (
    element.matches("button-view-model.you-chat-entrypoint-button > button") &&
    element.getAttribute("aria-label")?.trim().toLowerCase() === "ask"
  );
};

const getAriaLabelledByText = (element: HTMLElement): string => {
  const labelledBy = element.getAttribute("aria-labelledby")?.trim();
  if (!labelledBy) {
    return "";
  }

  return labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
    .filter((value) => value.length > 0)
    .join(" ");
};

const getSidebarContainerContextText = (element: HTMLElement): string => {
  const container = element.closest("dialog,[role='dialog'],nav,aside,header");
  if (!(container instanceof HTMLElement)) {
    return "";
  }

  const labelledByText = (() => {
    const labelledBy = container.getAttribute("aria-labelledby")?.trim();
    if (!labelledBy) {
      return "";
    }

    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .filter((value) => value.length > 0)
      .join(" ");
  })();

  return getJoinedElementText([
    container.tagName.toLowerCase(),
    container.getAttribute("role"),
    container.getAttribute("aria-label"),
    labelledByText,
    container.getAttribute("data-testid"),
    container.id,
    container.className,
    container.querySelector("[data-testid^='side-nav-menu-item-']") ? "side-nav-menu-item" : "",
    container.querySelector("nav") ? "nav" : ""
  ]);
};

export const scoreSidebarDirectiveCandidate = (element: HTMLElement): number => {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();
  const buttonLike = role === "button" || tagName === "button" || tagName === "summary";

  if (!buttonLike) {
    return 0;
  }

  if (isYouTubeAskButton(element)) {
    return 0;
  }

  if (isYouTubeMastheadGuideButton(element)) {
    return MAX_DIRECTIVE_SCORE;
  }

  const controlTarget = element.getAttribute("aria-controls");
  const controlledElement = controlTarget ? document.getElementById(controlTarget) : null;
  const ancestorDescriptorText = getAncestorDescriptorText(element);
  const labelledByText = getAriaLabelledByText(element);
  const sidebarContainerContextText = getSidebarContainerContextText(element);
  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "aria-labelledby",
      "title",
      "aria-description",
      "data-tooltip",
      "id",
      "class"
    ]),
    labelledByText,
    element.textContent,
    controlTarget,
    controlledElement?.getAttribute("aria-label"),
    controlledElement?.getAttribute("id"),
    controlledElement?.getAttribute("class"),
    ancestorDescriptorText,
    sidebarContainerContextText,
    element.querySelector("svg")?.getAttribute("class")
  ]);

  if (
    controlTarget &&
    SIDEBAR_TOKEN_PATTERN.test(getJoinedElementText([controlTarget, controlledElement?.id])) &&
    SIDEBAR_ACTION_PATTERN.test(descriptorText)
  ) {
    return MAX_DIRECTIVE_SCORE;
  }

  if (
    element.getAttribute("aria-haspopup")?.toLowerCase() === "menu" &&
    !SIDEBAR_TOKEN_PATTERN.test(descriptorText)
  ) {
    return 0;
  }

  const popupType = element.getAttribute("aria-haspopup")?.toLowerCase();
  if (
    popupType &&
    popupType !== "false" &&
    popupType !== "dialog" &&
    !SIDEBAR_TOKEN_PATTERN.test(descriptorText) &&
    !GUIDE_TOKEN_PATTERN.test(descriptorText) &&
    NON_SIDEBAR_MENU_PATTERN.test(descriptorText)
  ) {
    return 0;
  }

  const sidebarScore = Math.max(
    getPatternScore(descriptorText, SIDEBAR_TOKEN_PATTERN, 14),
    getPatternScore(controlTarget, SIDEBAR_TOKEN_PATTERN, 8)
  );
  const menuScore = /\b(menu|hamburger)\b/i.test(descriptorText) ? 6 : 0;
  const iconScore = SIDEBAR_ICON_PATTERN.test(descriptorText) ? 4 : 0;
  const actionScore = SIDEBAR_ACTION_PATTERN.test(descriptorText) ? 6 : 0;
  const guideScore =
    getPatternScore(descriptorText, GUIDE_TOKEN_PATTERN, 10) +
    (SHELL_CONTEXT_PATTERN.test(ancestorDescriptorText) ? 6 : 0);
  const sidebarContextScore =
    SIDEBAR_TOKEN_PATTERN.test(sidebarContainerContextText) ||
    /\bside-nav-menu-item\b/i.test(sidebarContainerContextText)
      ? 12
      : 0;
  const controlScore = controlTarget ? 4 : 0;
  const expandedScore = element.hasAttribute("aria-expanded") ? 3 : 0;
  const positionScore = (() => {
    const rect = element.getBoundingClientRect();
    return rect.top <= 160 && rect.left <= 160 ? 3 : 0;
  })();

  if (sidebarScore === 0 && menuScore === 0 && guideScore === 0 && sidebarContextScore === 0) {
    return 0;
  }

  return (
    sidebarScore +
    menuScore +
    iconScore +
    guideScore +
    sidebarContextScore +
    actionScore +
    controlScore +
    expandedScore +
    positionScore
  );
};