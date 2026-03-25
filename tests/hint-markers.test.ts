import { describe, expect, test } from "bun:test";
import { createHintMarker, setThumbnailMarkerIconVisibility } from "~/src/core/utils/hints/markers";
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

  test("keeps marker and thumbnail icons pinned to a horizontal inline-flex layout", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      const markerModel = createHintMarker("la", null, null, "current-tab", false, {
        markerAttribute: "data-nav-hint-marker",
        markerStyleAttribute: "data-nav-hint-marker-style",
        markerVariantStyleAttribute: "data-nav-hint-marker-variant",
        letterAttribute: "data-nav-hint-letter",
        letterStyleAttribute: "data-nav-hint-letter-style"
      });

      expect(markerModel.marker.style.getPropertyValue("display")).toBe("inline-flex");
      expect(markerModel.marker.style.getPropertyPriority("display")).toBe("important");
      expect(markerModel.marker.style.getPropertyValue("flex-direction")).toBe("row");
      expect(markerModel.marker.style.getPropertyValue("flex-wrap")).toBe("nowrap");

      const label = markerModel.marker.querySelector(".nav-hint-marker-label");
      expect(label instanceof HTMLSpanElement).toBe(true);

      if (!(label instanceof HTMLSpanElement) || !markerModel.thumbnailIcon) {
        return;
      }

      expect(label.style.getPropertyValue("display")).toBe("inline-flex");
      expect(label.style.getPropertyPriority("display")).toBe("important");

      expect(markerModel.thumbnailIcon.style.getPropertyValue("display")).toBe("none");
      expect(markerModel.thumbnailIcon.style.getPropertyPriority("display")).toBe("important");

      expect(
        setThumbnailMarkerIconVisibility(
          { directive: null, thumbnailIcon: markerModel.thumbnailIcon },
          true
        )
      ).toBe(true);
      expect(markerModel.thumbnailIcon.style.getPropertyValue("display")).toBe("inline-flex");
      expect(markerModel.thumbnailIcon.style.getPropertyPriority("display")).toBe("important");
      expect(markerModel.thumbnailIcon.style.getPropertyValue("flex-direction")).toBe("row");
      expect(markerModel.thumbnailIcon.style.getPropertyValue("flex-wrap")).toBe("nowrap");
    } finally {
      fixture.cleanup();
    }
  });
});