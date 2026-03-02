const NEUTRAL_STATUS_CLASSES = ["text-neutral-500"];
const ERROR_STATUS_CLASSES = ["text-rose-500"];

export const setEditorStatus = (element: HTMLParagraphElement, hasError: boolean): void => {
  element.classList.remove(...NEUTRAL_STATUS_CLASSES, ...ERROR_STATUS_CLASSES);
  element.classList.add(...(hasError ? ERROR_STATUS_CLASSES : NEUTRAL_STATUS_CLASSES));

  const icon = document.createElement("i");
  icon.className = hasError ? "ri-close-line" : "ri-check-line";

  const text = document.createElement("span");
  text.textContent = hasError ? "Contains errors" : "No errors detected";

  element.replaceChildren(icon, text);
};
