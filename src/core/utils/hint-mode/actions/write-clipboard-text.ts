import { getDeepActiveElement } from "~/src/core/utils/is-editable-target";

export const writeClipboardText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const active = getDeepActiveElement();
    const input =
      active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active : null;
    const offsets = input
      ? ([input.selectionStart, input.selectionEnd, input.selectionDirection] as const)
      : null;
    const selection = window.getSelection();
    const saved =
      selection?.anchorNode && selection.focusNode
        ? {
            anchor: selection.anchorNode,
            start: selection.anchorOffset,
            focus: selection.focusNode,
            end: selection.focusOffset
          }
        : null;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px";
    document.body.append(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea.remove();
      if (active instanceof HTMLElement && active.isConnected)
        active.focus({ preventScroll: true });
      if (input && offsets && offsets[0] !== null && offsets[1] !== null)
        input.setSelectionRange(offsets[0], offsets[1], offsets[2] ?? undefined);
      else if (saved && saved.anchor.isConnected && saved.focus.isConnected)
        selection?.setBaseAndExtent(saved.anchor, saved.start, saved.focus, saved.end);
    }
  }
};