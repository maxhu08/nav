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
const MAX_DIRECTIVE_SCORE = 9999;

export const scoreSidebarDirectiveCandidate = (element: HTMLElement): number => {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();
  const buttonLike = role === "button" || tagName === "button" || tagName === "summary";

  if (!buttonLike) {
    return 0;
  }

  const controlTarget = element.getAttribute("aria-controls");
  const controlledElement = controlTarget ? document.getElementById(controlTarget) : null;
  const ancestorDescriptorText = getAncestorDescriptorText(element);
  const descriptorText = getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "aria-description",
      "data-tooltip",
      "id",
      "class"
    ]),
    element.textContent,
    controlTarget,
    controlledElement?.getAttribute("aria-label"),
    controlledElement?.getAttribute("id"),
    controlledElement?.getAttribute("class"),
    ancestorDescriptorText
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

  const sidebarScore = Math.max(
    getPatternScore(descriptorText, SIDEBAR_TOKEN_PATTERN, 14),
    getPatternScore(controlTarget, SIDEBAR_TOKEN_PATTERN, 8)
  );
  const menuScore = /\b(menu|hamburger)\b/i.test(descriptorText) ? 6 : 0;
  const actionScore = SIDEBAR_ACTION_PATTERN.test(descriptorText) ? 6 : 0;
  const guideScore =
    getPatternScore(descriptorText, GUIDE_TOKEN_PATTERN, 10) +
    (SHELL_CONTEXT_PATTERN.test(ancestorDescriptorText) ? 6 : 0);
  const controlScore = controlTarget ? 4 : 0;
  const expandedScore = element.hasAttribute("aria-expanded") ? 3 : 0;
  const positionScore = (() => {
    const rect = element.getBoundingClientRect();
    return rect.top <= 160 && rect.left <= 160 ? 3 : 0;
  })();

  if (sidebarScore === 0 && menuScore === 0 && guideScore === 0) {
    return 0;
  }

  return (
    sidebarScore +
    menuScore +
    guideScore +
    actionScore +
    controlScore +
    expandedScore +
    positionScore
  );
};