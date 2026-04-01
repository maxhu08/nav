import {
  LETTER_ATTRIBUTE,
  MARKER_LABEL_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";

export const renderMarkerLabel = (
  marker: HTMLDivElement,
  label: string,
  typedLength: number,
  showCapitalizedLetters: boolean
): void => {
  const labelContainer = marker.querySelector(`[${MARKER_LABEL_ATTRIBUTE}="true"]`);
  const target = labelContainer instanceof HTMLSpanElement ? labelContainer : marker;
  target.replaceChildren();
  const display = showCapitalizedLetters ? label.toUpperCase() : label.toLowerCase();

  for (const [index, character] of Array.from(display).entries()) {
    const letter = document.createElement("span");
    letter.textContent = character;
    letter.setAttribute(LETTER_ATTRIBUTE, index < typedLength ? "typed" : "pending");
    target.append(letter);
  }
};