const NON_SELECTABLE_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "reset",
  "submit"
]);

export const isSelectableElement = (element: Element | null): boolean => {
  if (!element) {
    return false;
  }

  return (
    (element instanceof HTMLInputElement && !NON_SELECTABLE_INPUT_TYPES.has(element.type)) ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  );
};

export const isEditableElement = (element: Element | null): boolean =>
  isSelectableElement(element) || element instanceof HTMLSelectElement;

export const getDeepActiveElement = (root: Document | ShadowRoot = document): Element | null => {
  let activeElement: Element | null = root.activeElement;

  while (activeElement instanceof HTMLElement && activeElement.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  return activeElement;
};

export const isEditableTarget = (target: EventTarget | null | undefined): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  const editableContainer = target.closest(
    "input, textarea, select, [contenteditable], [contenteditable='true']"
  );

  return isEditableElement(editableContainer);
};