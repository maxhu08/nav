import {
  getActionDescriptorText,
  getPatternScore,
  isButtonLikeDirectiveCandidate
} from "~/src/core/utils/hint-mode/directive-recognition/shared";

const SUBMIT_TOKEN_PATTERN = /\b(submit|send|post|confirm|continue|done|apply)\b/i;

export const scoreSubmitDirectiveCandidate = (element: HTMLElement): number => {
  if (!isButtonLikeDirectiveCandidate(element)) {
    return 0;
  }

  const submitTypeScore =
    element instanceof HTMLInputElement && element.type.toLowerCase() === "submit" ? 10 : 0;

  return (
    getPatternScore(getActionDescriptorText(element), SUBMIT_TOKEN_PATTERN, 18) + submitTypeScore
  );
};