import { describe, expect, test } from "bun:test";
import { createHintMarker } from "~/src/core/utils/hints/markers";
import { HINT_DIRECTIVE_ICON_PATHS } from "~/src/lib/hint-directive-icons";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("hint markers", () => {
  test("renders directive markers with only their directive icon across modes", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      for (const mode of ["current-tab", "copy-image", "new-tab"] as const) {
        const markerModel = createHintMarker("kj", "input", null, mode, false, {
          markerAttribute: "data-nav-hint-marker",
          markerStyleAttribute: "data-nav-hint-marker-style",
          markerVariantStyleAttribute: "data-nav-hint-marker-variant",
          letterAttribute: "data-nav-hint-letter",
          letterStyleAttribute: "data-nav-hint-letter-style"
        });

        const icons = markerModel.marker.querySelectorAll(".nav-hint-marker-icon");
        expect(icons).toHaveLength(1);
        expect(markerModel.thumbnailIcon).toBeNull();

        const path = icons[0]?.querySelector("path")?.getAttribute("d");
        expect(path).toBe(HINT_DIRECTIVE_ICON_PATHS.input);
      }
    } finally {
      fixture.cleanup();
    }
  });
});