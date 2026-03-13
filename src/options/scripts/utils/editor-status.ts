const NEUTRAL_STATUS_CLASSES = ["text-neutral-500"];
const ERROR_STATUS_CLASSES = ["text-rose-500"];
const COMPACT_LAYOUT_CLASSES = ["items-center"];
const DETAIL_LAYOUT_CLASSES = ["flex-col", "items-start"];

export type EditorStatusError = {
  code: string;
  message: string;
};

const toStatusErrors = (value: boolean | EditorStatusError[]): EditorStatusError[] => {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [{ code: "invalid", message: "Contains one or more invalid entries." }] : [];
};

export const setEditorStatus = (
  element: HTMLParagraphElement,
  hasErrorOrErrors: boolean | EditorStatusError[]
): void => {
  const errors = toStatusErrors(hasErrorOrErrors);
  const hasError = errors.length > 0;

  element.classList.remove(...NEUTRAL_STATUS_CLASSES, ...ERROR_STATUS_CLASSES);
  element.classList.add(...(hasError ? ERROR_STATUS_CLASSES : NEUTRAL_STATUS_CLASSES));
  element.classList.remove(...COMPACT_LAYOUT_CLASSES, ...DETAIL_LAYOUT_CLASSES);
  element.classList.add(...(hasError ? DETAIL_LAYOUT_CLASSES : COMPACT_LAYOUT_CLASSES));
  element.dataset.hasError = hasError ? "true" : "false";

  const icon = document.createElement("i");
  icon.className = hasError ? "ri-close-line" : "ri-check-line";

  const text = document.createElement("span");
  text.textContent = hasError ? "Contains errors" : "No errors detected";

  const heading = document.createElement("span");
  heading.className = "inline-flex items-center gap-1.5";
  heading.append(icon, text);

  if (!hasError) {
    element.replaceChildren(heading);
    return;
  }

  const errorItems = errors.map((error) => {
    const item = document.createElement("span");
    item.className = "block text-base leading-6";
    item.textContent = `[${error.code}] ${error.message}`;
    return item;
  });

  element.replaceChildren(heading, ...errorItems);
};

export const hasEditorError = (element: HTMLParagraphElement): boolean =>
  element.dataset.hasError === "true";