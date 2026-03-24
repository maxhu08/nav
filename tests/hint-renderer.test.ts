import { describe, expect, test } from "bun:test";
import { getDefaultHintMarkerCSS } from "~/src/core/utils/hints/renderer";

describe("hint marker renderer", () => {
  test("caps marker width to the viewport", () => {
    const css = getDefaultHintMarkerCSS(
      "data-nav-hint-marker-style",
      "data-nav-hint-marker-variant",
      "data-nav-hint-letter-style"
    );

    expect(css).toContain("max-width:calc(100vw - 16px)");
    expect(css).toContain("overflow:hidden");
  });
});