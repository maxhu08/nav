import { describe, expect, test } from "bun:test";
import { EXTERNAL_LINK_ICON_PATH } from "~/src/lib/inline-icons";
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

const expectExternalLinkIconMarker = (
  target: ReturnType<typeof buildHintTargets>[number] | undefined
): void => {
  expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
  expect(target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML).toContain(
    EXTERNAL_LINK_ICON_PATH
  );
};

describe("buildHintTargets new tab mode", () => {
  test("only includes targets with link urls", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="docs-link" href="https://example.com/docs">Docs</a>
        <button id="plain-button" type="button">Click</button>
      </main>
    `);

    try {
      const targets = buildHintTargets("new-tab", "abcd", 1, false);

      expect(targets).toHaveLength(1);
      expect(targets[0]?.element.id).toBe("docs-link");
      expectExternalLinkIconMarker(targets[0]);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps the external link icon even when the link matches another directive", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="download-link" href="https://example.com/report.csv" download aria-label="Download report">
          Download
        </a>
      </main>
    `);

    try {
      const [target] = buildHintTargets("new-tab", "abcd", 1, false, directiveLabels);

      expect(target?.directiveMatch?.directive).toBe("download");
      expectExternalLinkIconMarker(target);
    } finally {
      fixture.cleanup();
    }
  });

  test("uses thumbnail markers for media links when enabled", () => {
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

      const [target] = buildHintTargets("new-tab", "abcd", 1, false, undefined, [], {}, true);

      expect(target?.isMediaThumbnail).toBe(true);
      expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("thumbnail");
      expect(
        target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(EXTERNAL_LINK_ICON_PATH);
    } finally {
      fixture.cleanup();
    }
  });
});