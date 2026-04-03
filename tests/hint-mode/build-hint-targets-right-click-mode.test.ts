import { describe, expect, test } from "bun:test";
import { HINT_CURSOR_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const setRect = (
  element: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number
): void => {
  const rect = new DOMRect(left, top, width, height);
  element.getBoundingClientRect = (): DOMRect => rect;
  element.getClientRects = (): DOMRectList => {
    const list = [rect] as unknown as DOMRectList & DOMRect[];
    list.item = (index: number): DOMRect | null => list[index] ?? null;
    return list;
  };
};

describe("buildHintTargets right click mode", () => {
  test("ignores directives and forces the cursor icon for every hint", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="download-link" href="https://example.com/report.csv" download aria-label="Download report">
          Download
        </a>
      </main>
    `);

    try {
      const [target] = buildHintTargets("right-click", "abcd", 1, false, directiveLabels);

      expect(target?.directiveMatch).toBeUndefined();
      expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
      expect(
        target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_CURSOR_ICON_PATH);
    } finally {
      fixture.cleanup();
    }
  });

  test("uses thumbnail markers for media targets when enabled", () => {
    const fixture = createDomFixture(
      '<a id="thumb" href="https://example.com/watch"><img id="thumb-image" src="https://example.com/thumb.jpg" alt="" /></a>'
    );

    try {
      const thumbnailLink = document.getElementById("thumb");
      const thumbnailImage = document.getElementById("thumb-image");
      expect(thumbnailLink).toBeInstanceOf(HTMLElement);
      expect(thumbnailImage).toBeInstanceOf(HTMLElement);
      setRect(thumbnailLink as HTMLElement, 100, 200, 200, 120);
      setRect(thumbnailImage as HTMLElement, 100, 200, 200, 120);

      const [target] = buildHintTargets("right-click", "abcd", 1, false, undefined, [], {}, true);

      expect(target?.isMediaThumbnail).toBe(true);
      expect(target?.directiveMatch).toBeUndefined();
      expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("thumbnail");
      expect(
        target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_CURSOR_ICON_PATH);
    } finally {
      fixture.cleanup();
    }
  });
});