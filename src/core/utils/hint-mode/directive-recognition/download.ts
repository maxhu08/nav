import {
  getActionDescriptorText,
  getPatternScore,
  isActionableDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const DOWNLOAD_TOKEN_PATTERN = /\b(download|export|downloads)\b/i;

export const scoreDownloadDirectiveCandidate = (element: HTMLElement): number => {
  if (!isActionableDirectiveCandidate(element)) {
    return 0;
  }

  const descriptorText = getActionDescriptorText(element);
  const downloadAttributeScore = element.hasAttribute("download") ? 10 : 0;

  return getPatternScore(descriptorText, DOWNLOAD_TOKEN_PATTERN, 18) + downloadAttributeScore;
};