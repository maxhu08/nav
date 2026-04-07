import { describe, expect, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { renderHintTargets } from "~/src/core/utils/hint-mode/rendering/render-hint-targets";
import { HINT_DOWNLOAD_ICON_PATH } from "~/src/lib/inline-icons";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";

const setViewport = (width: number, height: number): void => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height
  });
};

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

const setMarkerSize = (marker: HTMLDivElement, width: number, height: number): void => {
  Object.defineProperty(marker, "offsetWidth", {
    configurable: true,
    get: () => width
  });
  Object.defineProperty(marker, "offsetHeight", {
    configurable: true,
    get: () => height
  });
};

describe("thumbnail hint markers", () => {
  test("always shows a play icon for media thumbnails", () => {
    const fixture = createDomFixture(
      '<a id="thumb" href="https://example.com/watch"><img src="https://example.com/thumb.jpg" alt="" /></a>'
    );

    try {
      setViewport(1280, 720);
      const thumbnailLink = document.getElementById("thumb");
      const thumbnailImage = document.querySelector("#thumb img");
      expect(thumbnailLink).toBeInstanceOf(HTMLElement);
      expect(thumbnailImage).toBeInstanceOf(HTMLElement);
      setRect(thumbnailLink as HTMLElement, 100, 200, 200, 120);
      setRect(thumbnailImage as HTMLElement, 100, 200, 200, 120);

      const targets = buildHintTargets("current-tab", "asdf", 1, false, undefined, [], {}, false);
      expect(targets).toHaveLength(1);

      expect(targets[0]?.isMediaThumbnail).toBe(true);
      expect(targets[0]?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("inline-icon");
      expect(targets[0]?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)).toBeTruthy();
    } finally {
      fixture.cleanup();
    }
  });

  test("uses the larger centered thumbnail marker when enabled", () => {
    const fixture = createDomFixture(
      '<a id="thumb" href="https://example.com/watch"><img src="https://example.com/thumb.jpg" alt="" /></a>'
    );

    try {
      setViewport(1280, 720);
      const thumbnailLink = document.getElementById("thumb");
      const thumbnailImage = document.querySelector("#thumb img");
      expect(thumbnailLink).toBeInstanceOf(HTMLElement);
      expect(thumbnailImage).toBeInstanceOf(HTMLElement);
      setRect(thumbnailLink as HTMLElement, 100, 200, 200, 120);
      setRect(thumbnailImage as HTMLElement, 100, 200, 200, 120);

      const targets = buildHintTargets("current-tab", "asdf", 1, false, undefined, [], {}, true);
      expect(targets).toHaveLength(1);
      expect(targets[0]?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("thumbnail");

      setMarkerSize(targets[0]!.marker, 80, 32);
      renderHintTargets(targets, true);

      expect(targets[0]?.marker.style.left).toBe("160px");
      expect(targets[0]?.marker.style.top).toBe("244px");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not apply improved thumbnail markers to directive-recognized thumbnails", () => {
    const fixture = createDomFixture(
      '<a id="download-thumb" href="https://example.com/report.mp4" download aria-label="Download video"><img id="download-thumb-image" src="https://example.com/thumb.jpg" alt="" /></a>'
    );

    try {
      setViewport(1280, 720);
      const thumbnailLink = document.getElementById("download-thumb");
      const thumbnailImage = document.getElementById("download-thumb-image");
      expect(thumbnailLink).toBeInstanceOf(HTMLElement);
      expect(thumbnailImage).toBeInstanceOf(HTMLElement);
      setRect(thumbnailLink as HTMLElement, 100, 200, 200, 120);
      setRect(thumbnailImage as HTMLElement, 100, 200, 200, 120);

      const [target] = buildHintTargets(
        "current-tab",
        "asdf",
        1,
        false,
        directiveLabels,
        [],
        {},
        true
      );

      expect(target?.isMediaThumbnail).toBe(true);
      expect(target?.directiveMatch?.directive).toBe("download");
      expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
      expect(
        target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_DOWNLOAD_ICON_PATH);

      setMarkerSize(target!.marker, 80, 32);
      renderHintTargets([target!], true);

      expect(target?.marker.style.left).toBe("116px");
      expect(target?.marker.style.top).toBe("200px");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat wide guide rows with tiny icons as thumbnails", () => {
    const fixture = createDomFixture(`
      <a id="guide-link" href="/feed/history" role="link" title="History">
        <tp-yt-paper-item role="link" tabindex="0" aria-disabled="false">
          <img id="guide-icon" src="https://example.com/icon.png" alt="" hidden />
          <span>History</span>
        </tp-yt-paper-item>
      </a>
    `);

    try {
      setViewport(1280, 720);
      const guideLink = document.getElementById("guide-link");
      const guideIcon = document.getElementById("guide-icon");
      expect(guideLink).toBeInstanceOf(HTMLElement);
      expect(guideIcon).toBeInstanceOf(HTMLElement);
      setRect(guideLink as HTMLElement, 0, 0, 240, 48);
      setRect(guideIcon as HTMLElement, 12, 12, 24, 24);

      const targets = buildHintTargets("current-tab", "asdf", 1, false, undefined, [], {}, true);
      expect(targets).toHaveLength(1);
      expect(targets[0]?.isMediaThumbnail).toBe(false);
      expect(targets[0]?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
      expect(targets[0]?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)).toBeNull();
    } finally {
      fixture.cleanup();
    }
  });

  test("treats portrait shorts thumbnails as thumbnails", () => {
    const fixture = createDomFixture(`
      <a id="shorts-link" href="https://www.youtube.com/shorts/abc123">
        <img id="shorts-poster" src="https://example.com/short.jpg" alt="" />
      </a>
    `);

    try {
      setViewport(1280, 720);
      const shortsLink = document.getElementById("shorts-link");
      const shortsPoster = document.getElementById("shorts-poster");
      expect(shortsLink).toBeInstanceOf(HTMLElement);
      expect(shortsPoster).toBeInstanceOf(HTMLElement);
      setRect(shortsLink as HTMLElement, 300, 80, 140, 248);
      setRect(shortsPoster as HTMLElement, 300, 80, 140, 248);

      const targets = buildHintTargets("current-tab", "asdf", 1, false, undefined, [], {}, true);
      expect(targets).toHaveLength(1);
      expect(targets[0]?.isMediaThumbnail).toBe(true);
      expect(targets[0]?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("thumbnail");
    } finally {
      fixture.cleanup();
    }
  });
});