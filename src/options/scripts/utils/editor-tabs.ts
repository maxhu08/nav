const EDITOR_INDENT = "  ";

const insertIndent = (input: HTMLInputElement | HTMLTextAreaElement): void => {
  const selectionStart = input.selectionStart ?? input.value.length;
  const selectionEnd = input.selectionEnd ?? selectionStart;

  input.setRangeText(EDITOR_INDENT, selectionStart, selectionEnd, "end");
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

export const enableEditorTabInsertion = (input: HTMLInputElement | HTMLTextAreaElement): void => {
  input.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (event.key !== "Tab" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    event.preventDefault();
    insertIndent(input);
  });
};