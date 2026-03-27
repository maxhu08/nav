import { LETTER_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";

export const renderMarkerLabel = (
  marker: HTMLDivElement,
  label: string,
  typedLength: number,
  showCapitalizedLetters: boolean
): void => {
  marker.replaceChildren();
  const display = showCapitalizedLetters ? label.toUpperCase() : label.toLowerCase();

  for (const [index, character] of Array.from(display).entries()) {
    const letter = document.createElement("span");
    letter.textContent = character;
    letter.setAttribute(LETTER_ATTRIBUTE, index < typedLength ? "typed" : "pending");
    marker.append(letter);
  }
};