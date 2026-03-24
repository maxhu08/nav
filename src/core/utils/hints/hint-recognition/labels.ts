import type { GetPreference } from "~/src/core/utils/hints/hint-recognition/shared";

const getAssociatedLabelControl = (element: HTMLElement): HTMLElement | null => {
  if (element instanceof HTMLLabelElement && element.control instanceof HTMLElement) {
    return element.control;
  }

  const ancestorLabel = element.closest("label");
  if (ancestorLabel instanceof HTMLLabelElement && ancestorLabel.control instanceof HTMLElement) {
    return ancestorLabel.control;
  }

  return null;
};

export const dedupeEquivalentLabelTargets = (
  elements: HTMLElement[],
  getPreference: GetPreference
): HTMLElement[] => {
  const labelRepresentatives = new Map<HTMLElement, HTMLElement>();

  for (const element of elements) {
    const control = getAssociatedLabelControl(element);
    if (!control) {
      continue;
    }

    const existing = labelRepresentatives.get(control);
    if (!existing) {
      labelRepresentatives.set(control, element);
      continue;
    }

    const elementScore = (element === control ? 1000 : 0) + getPreference(element);
    const existingScore = (existing === control ? 1000 : 0) + getPreference(existing);
    if (elementScore > existingScore) {
      labelRepresentatives.set(control, element);
    }
  }

  return elements.filter((element) => {
    const control = getAssociatedLabelControl(element);
    return !control || labelRepresentatives.get(control) === element;
  });
};