import { describe, expect, test } from "bun:test";
import { writeClipboardText } from "~/src/core/utils/hint-mode/actions/write-clipboard-text";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("selection clipboard", () => {
  test("clipboard fallback restores backward selections and focused input offsets", async () => {
    const fixture = createDomFixture(
      '<p id="text">alpha beta</p><textarea id="input">one two</textarea>'
    );
    try {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("denied");
          }
        }
      });
      const copied: string[] = [];
      document.execCommand = () => {
        copied.push((document.activeElement as HTMLTextAreaElement).value);
        return true;
      };
      const node = document.getElementById("text")!.firstChild!;
      window.getSelection()!.setBaseAndExtent(node, 5, node, 0);
      expect(await writeClipboardText("alpha")).toBe(true);
      expect(window.getSelection()!.anchorOffset).toBe(5);
      expect(window.getSelection()!.focusOffset).toBe(0);
      const input = document.getElementById("input") as HTMLTextAreaElement;
      input.focus();
      input.setSelectionRange(0, 3, "backward");
      expect(await writeClipboardText("one")).toBe(true);
      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(3);
      expect(input.selectionDirection).toBe("backward");
      expect(copied).toEqual(["alpha", "one"]);
      expect(document.querySelectorAll("textarea")).toHaveLength(1);
    } finally {
      fixture.cleanup();
    }
  });
  test("reports failure when both clipboard paths fail and removes temporary elements", async () => {
    const fixture = createDomFixture("<p>text</p>");
    try {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("denied");
          }
        }
      });
      document.execCommand = () => {
        throw new Error("unsupported");
      };
      expect(await writeClipboardText("text")).toBe(false);
      expect(document.querySelector("textarea")).toBeNull();
    } finally {
      fixture.cleanup();
    }
  });
});