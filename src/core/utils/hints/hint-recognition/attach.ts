import { getAttachCandidateScore } from "~/src/core/utils/hints/directive-recognition";
import type { GetPreference, GetRect } from "~/src/core/utils/hints/hint-recognition/shared";

const getAssociatedFileInput = (element: HTMLElement): HTMLInputElement | null => {
  if (element instanceof HTMLInputElement && element.type.toLowerCase() === "file") {
    return element;
  }

  if (
    element instanceof HTMLLabelElement &&
    element.control instanceof HTMLInputElement &&
    element.control.type.toLowerCase() === "file"
  ) {
    return element.control;
  }

  const ancestorLabel = element.closest("label");
  if (
    ancestorLabel instanceof HTMLLabelElement &&
    ancestorLabel.control instanceof HTMLInputElement &&
    ancestorLabel.control.type.toLowerCase() === "file"
  ) {
    return ancestorLabel.control;
  }

  return null;
};

export const dedupeEquivalentAttachTargets = (
  elements: HTMLElement[],
  getRect: GetRect,
  getPreference: GetPreference
): HTMLElement[] => {
  const attachRepresentatives = new Map<HTMLInputElement, HTMLElement>();

  for (const element of elements) {
    const control = getAssociatedFileInput(element);
    if (!control) {
      continue;
    }

    const existing = attachRepresentatives.get(control);
    if (!existing) {
      attachRepresentatives.set(control, element);
      continue;
    }

    const elementScore = getAttachCandidateScore(element, getRect(element));
    const existingScore = getAttachCandidateScore(existing, getRect(existing));
    if (
      elementScore > existingScore ||
      (elementScore === existingScore && getPreference(element) > getPreference(existing))
    ) {
      attachRepresentatives.set(control, element);
    }
  }

  return elements.filter((element) => {
    const control = getAssociatedFileInput(element);
    return !control || attachRepresentatives.get(control) === element;
  });
};