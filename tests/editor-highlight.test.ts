import { describe, expect, test } from "bun:test";
import { getTextareaOverlayHTML } from "~/src/options/scripts/utils/editor-highlight";

describe("getTextareaOverlayHTML", () => {
  test("keeps an empty editor on a visible first line", () => {
    expect(getTextareaOverlayHTML("", "")).toBe(" ");
  });

  test("preserves a trailing newline for textarea overlays", () => {
    expect(getTextareaOverlayHTML("abc\n", "abc\n")).toBe("abc\n ");
  });

  test("leaves normal content unchanged", () => {
    expect(getTextareaOverlayHTML("abc", "<span>abc</span>")).toBe("<span>abc</span>");
  });
});