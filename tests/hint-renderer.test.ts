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

  test("locks icon markers to a single horizontal row", () => {
    const css = getDefaultHintMarkerCSS(
      "data-nav-hint-marker-style",
      "data-nav-hint-marker-variant",
      "data-nav-hint-letter-style"
    );

    expect(css).toContain("display:inline-flex !important");
    expect(css).toContain("flex-direction:row !important");
    expect(css).toContain("flex-wrap:nowrap !important");
    expect(css).toContain(".nav-hint-marker-label span{display:inline-block !important");
    expect(css).toContain(".nav-hint-marker-icon{display:inline-flex !important");
  });
});