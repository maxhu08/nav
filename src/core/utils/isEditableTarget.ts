export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const editableContainer = target.closest(
    "input, textarea, select, button, [contenteditable], [contenteditable='true']"
  );

  if (!editableContainer) {
    return false;
  }

  if (editableContainer instanceof HTMLInputElement) {
    const nonTextTypes = new Set([
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit"
    ]);

    return !nonTextTypes.has(editableContainer.type);
  }

  return true;
}
