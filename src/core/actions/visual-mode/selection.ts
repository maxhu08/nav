import { getDeepActiveElement, isEditableTarget } from "~/src/core/utils/is-editable-target";
import { scrollRangeIntoView } from "~/src/core/actions/scroll";

type Direction = "forward" | "backward";
export type SelectionSnapshot =
  | {
      anchor: Node;
      start: number;
      focus: Node;
      end: number;
      anchorText: string | null;
      focusText: string | null;
      text: string;
    }
  | {
      input: HTMLInputElement | HTMLTextAreaElement;
      value: string;
      start: number;
      end: number;
      direction: "forward" | "backward" | "none";
    };

const opposite = (direction: Direction): Direction =>
  direction === "forward" ? "backward" : "forward";
const word = (value: string): boolean => !!value && /[\p{L}\p{N}\p{M}_]/u.test(value);
const block = (node: Node | null): Element | null =>
  node?.parentElement?.closest("p, div, li, pre, blockquote, h1, h2, h3, h4, h5, h6, td") ?? null;

const usableText = (node: Node): boolean => {
  const element = node.parentElement;
  if (
    !element ||
    !node.textContent?.trim() ||
    element.closest(
      "script, style, noscript, select, option, [data-nav-overlay-root], [data-sonner-toaster]"
    ) ||
    isEditableTarget(element)
  )
    return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.visibility !== "collapse" &&
    style.opacity !== "0"
  );
};

const inViewport = (range: Range | Element): boolean =>
  Array.from(range.getClientRects()).some(
    (rect) =>
      rect.bottom >= 0 &&
      rect.top < window.innerHeight &&
      rect.right >= 0 &&
      rect.left < window.innerWidth
  );

export const createVisualSelection = () => {
  const selection = (): Selection => window.getSelection()!;
  const control = (): HTMLInputElement | HTMLTextAreaElement | null => {
    const active = getDeepActiveElement();
    return (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
      active.selectionStart !== null
      ? active
      : null;
  };
  const isCollapsed = (): boolean => {
    const input = control();
    return input ? input.selectionStart === input.selectionEnd : selection().isCollapsed;
  };
  const isForward = (): boolean => {
    const input = control();
    if (input) return input.selectionDirection !== "backward";
    const current = selection();
    const range = current.getRangeAt(0);
    return (
      range.startContainer === current.anchorNode && range.startOffset === current.anchorOffset
    );
  };
  const snapshot = (): SelectionSnapshot | null => {
    const input = control();
    if (input)
      return {
        input,
        value: input.value,
        start: input.selectionStart!,
        end: input.selectionEnd!,
        direction: input.selectionDirection!
      };
    const current = selection();
    if (!current.anchorNode || !current.focusNode) return null;
    return {
      anchor: current.anchorNode,
      start: current.anchorOffset,
      focus: current.focusNode,
      end: current.focusOffset,
      anchorText: current.anchorNode.textContent,
      focusText: current.focusNode.textContent,
      text: current.getRangeAt(0).toString()
    };
  };
  const valid = (saved: SelectionSnapshot): boolean => {
    if ("input" in saved)
      return (
        saved.input.isConnected &&
        saved.input.ownerDocument === document &&
        saved.input.value === saved.value
      );
    const limit = (node: Node): number =>
      node.nodeType === Node.TEXT_NODE ? node.textContent!.length : node.childNodes.length;
    return (
      saved.anchor.isConnected &&
      saved.focus.isConnected &&
      saved.anchor.ownerDocument === document &&
      saved.focus.ownerDocument === document &&
      saved.start <= limit(saved.anchor) &&
      saved.end <= limit(saved.focus) &&
      saved.anchor.textContent === saved.anchorText &&
      saved.focus.textContent === saved.focusText
    );
  };
  const restore = (saved: SelectionSnapshot): boolean => {
    if (!valid(saved)) return false;
    if ("input" in saved) {
      saved.input.focus();
      saved.input.setSelectionRange(saved.start, saved.end, saved.direction);
      return true;
    }
    const range = document.createRange();
    range.setStart(saved.anchor, saved.start);
    range.setEnd(saved.focus, saved.end);
    if (range.collapsed) {
      range.setStart(saved.focus, saved.end);
      range.setEnd(saved.anchor, saved.start);
    }
    if (range.toString() !== saved.text) return false;
    selection().setBaseAndExtent(saved.anchor, saved.start, saved.focus, saved.end);
    return true;
  };
  const collapse = (endpoint: "anchor" | "focus"): void => {
    const input = control();
    if (input) {
      const backward = input.selectionDirection === "backward";
      const offset =
        (endpoint === "anchor") !== backward ? input.selectionStart! : input.selectionEnd!;
      input.setSelectionRange(offset, offset);
      return;
    }
    const current = selection();
    const node = endpoint === "anchor" ? current.anchorNode : current.focusNode;
    if (node)
      current.collapse(node, endpoint === "anchor" ? current.anchorOffset : current.focusOffset);
  };
  const modify = (
    method: "move" | "extend",
    direction: Direction,
    granularity: string
  ): boolean => {
    const current = selection();
    const input = control();
    const start = input?.selectionStart;
    const end = input?.selectionEnd;
    const node = current.focusNode;
    const offset = current.focusOffset;
    current.modify(method, direction, granularity);
    if (input) return start !== input.selectionStart || end !== input.selectionEnd;
    return node !== current.focusNode || offset !== current.focusOffset;
  };
  const setRange = (range: Range): void => {
    selection().removeAllRanges();
    selection().addRange(range);
  };
  const nextCharacter = (direction: Direction = "forward"): string => {
    const input = control();
    if (input) {
      const offset =
        input.selectionDirection === "backward" ? input.selectionStart! : input.selectionEnd!;
      return direction === "forward"
        ? (Array.from(input.value.slice(offset))[0] ?? "")
        : (Array.from(input.value.slice(0, offset)).at(-1) ?? "");
    }
    const saved = snapshot();
    if (!saved) return "";
    collapse("focus");
    modify("extend", direction, "character");
    const text = selection().toString();
    restore(saved);
    return text;
  };
  const reverse = (): void => {
    const saved = snapshot();
    if (!saved) return;
    if ("input" in saved) {
      saved.input.setSelectionRange(
        saved.start,
        saved.end,
        saved.direction === "backward" ? "forward" : "backward"
      );
      return;
    }
    selection().collapse(saved.focus, saved.end);
    selection().extend(saved.anchor, saved.start);
  };
  const move = (method: "move" | "extend", direction: Direction, granularity: string): void => {
    if (granularity === "vimword" || granularity === "word") {
      const advance = (predicate: (value: string) => boolean): void => {
        while (nextCharacter(direction) && predicate(nextCharacter(direction))) {
          if (!modify("extend", direction, "character")) break;
        }
      };
      if (granularity === "vimword") {
        advance(word);
        advance((text) => !word(text));
      } else {
        advance((text) => !word(text));
        advance(word);
      }
      if (method === "move") collapse("focus");
      return;
    }
    if (granularity === "documentboundary") {
      if (control()) {
        modify(method, direction, granularity);
        return;
      }
      const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let target: Node | null = null;
      while (nodes.nextNode()) {
        if (!usableText(nodes.currentNode)) continue;
        const range = document.createRange();
        range.selectNodeContents(nodes.currentNode);
        if (!range.getClientRects().length) continue;
        target = nodes.currentNode;
        if (direction === "backward") break;
      }
      if (target) {
        const offset = direction === "forward" ? target.textContent!.length : 0;
        if (method === "move") selection().collapse(target, offset);
        else selection().extend(target, offset);
      }
      return;
    }
    if (modify(method, direction, granularity)) return;
    // Firefox does not implement native sentence/paragraph granularities.
    if (control() || (granularity !== "sentence" && granularity !== "paragraph")) return;
    const initial = block(selection().focusNode);
    let steps = 0;
    while (modify(method, direction, "character")) {
      if (granularity === "paragraph" && block(selection().focusNode) !== initial) break;
      const saved = snapshot();
      if (!saved) break;
      collapse("focus");
      modify("extend", opposite(direction), "character");
      const text = selection().toString();
      restore(saved);
      if (
        granularity === "paragraph"
          ? /\n/.test(text)
          : /[.!?。！？]/u.test(text) && (direction === "forward" || steps > 0)
      ) {
        if (granularity === "sentence" && direction === "backward") {
          modify(method, "forward", "character");
          while (/\s/u.test(nextCharacter())) if (!modify(method, "forward", "character")) break;
        }
        break;
      }
      steps++;
    }
  };
  const linewise = (): void => {
    if (!control() && !selection().rangeCount) return;
    const forward = isForward();
    move("extend", forward ? "forward" : "backward", "lineboundary");
    reverse();
    move("extend", forward ? "backward" : "forward", "lineboundary");
    reverse();
  };
  const selectEntity = (entity: "word" | "sentence", count: number, inner = false): void => {
    const forward = isForward();
    const selected = !isCollapsed();
    collapse("focus");
    if (inner) {
      if (selected && forward) modify("move", "backward", "character");
      // On whitespace, iw selects that whitespace rather than the next word.
      const whitespace = /\s/u.test(nextCharacter());
      const predicate = whitespace
        ? (text: string) => /\s/u.test(text)
        : word(nextCharacter())
          ? word
          : (text: string) => !!text && !word(text) && !/\s/u.test(text);
      while (true) {
        const saved = snapshot();
        if (!saved || !modify("extend", "backward", "character")) break;
        const text = selection().toString();
        if (!predicate(text)) {
          restore(saved);
          break;
        }
        collapse("focus");
      }
      for (let index = 0; index < count; index++) {
        if (index > 0)
          while (nextCharacter() && !word(nextCharacter())) {
            if (!modify("extend", "forward", "character")) break;
          }
        while (nextCharacter() && predicate(nextCharacter())) {
          if (!modify("extend", "forward", "character")) break;
        }
      }
      return;
    }
    if (entity === "word") move("extend", "forward", "character");
    move("extend", "backward", entity);
    collapse("focus");
    for (let index = 0; index < count; index++) move("extend", "forward", entity);
  };
  const establish = (): boolean => {
    const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let fallback: Range | null = null;
    while (nodes.nextNode()) {
      const node = nodes.currentNode;
      if (!usableText(node)) continue;
      const range = document.createRange();
      const offset = node.textContent!.search(/\S/u);
      range.setStart(node, offset);
      range.setEnd(node, offset + 1);
      if (!inViewport(range)) continue;
      fallback ??= range;
      if (node.textContent!.trim().length < 50) continue;
      range.collapse(true);
      setRange(range);
      return true;
    }
    if (!fallback) return false;
    fallback.collapse(true);
    setRange(fallback);
    return true;
  };
  const scrollIntoView = (): void => {
    const input = control();
    if (input) {
      input.scrollIntoView({ block: "nearest", inline: "nearest" });
      return;
    }
    const current = selection();
    if (!current.focusNode) return;
    const range = document.createRange();
    range.setStart(current.focusNode, current.focusOffset);
    range.collapse(true);
    scrollRangeIntoView(range);
  };
  const selectLine = (count: number): void => {
    if (isForward()) reverse();
    move("extend", "backward", "lineboundary");
    reverse();
    for (let index = 1; index < count; index++) move("extend", "forward", "line");
    move("extend", "forward", "lineboundary");
    if (nextCharacter() === "\n") move("extend", "forward", "character");
  };
  return {
    snapshot,
    restore,
    collapse,
    move,
    reverse,
    linewise,
    selectEntity,
    selectLine,
    setRange,
    establish,
    scrollIntoView,
    supported: (): boolean => typeof window.getSelection()?.modify === "function",
    text: (): string => {
      const input = control();
      return input
        ? input.value.slice(input.selectionStart!, input.selectionEnd!)
        : selection().toString();
    },
    hasRange: (): boolean => !!control() || !!selection().rangeCount,
    isCollapsed,
    visible: (): boolean => {
      const input = control();
      return input
        ? inViewport(input)
        : !!selection().rangeCount && inViewport(selection().getRangeAt(0));
    },
    showCaret: (): void => {
      modify("extend", "forward", "character");
    },
    ensureCharacter: (): void => {
      if (isCollapsed() && !modify("extend", "forward", "character"))
        modify("extend", "backward", "character");
    }
  };
};