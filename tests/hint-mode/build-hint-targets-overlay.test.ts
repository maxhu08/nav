import { describe, expect, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("buildHintTargets overlay filtering", () => {
  test("skips clickable elements that are blocked by a modal overlay", () => {
    const fixture = createDomFixture(`
      <button id="blocked" type="button">Blocked action</button>
      <div id="overlay" aria-hidden="true"></div>
    `);

    try {
      const blockedButton = document.getElementById("blocked") as HTMLButtonElement;
      const overlay = document.getElementById("overlay") as HTMLDivElement;
      const blockedRect = new DOMRect(20, 20, 120, 40);
      const overlayRect = new DOMRect(0, 0, 200, 200);

      blockedButton.getBoundingClientRect = (): DOMRect => blockedRect;
      overlay.getBoundingClientRect = (): DOMRect => overlayRect;

      document.elementsFromPoint = (x: number, y: number): Element[] => {
        const withinOverlay =
          x >= overlayRect.left &&
          x <= overlayRect.right &&
          y >= overlayRect.top &&
          y <= overlayRect.bottom;
        const withinButton =
          x >= blockedRect.left &&
          x <= blockedRect.right &&
          y >= blockedRect.top &&
          y <= blockedRect.bottom;

        if (withinOverlay && withinButton) {
          return [overlay, blockedButton];
        }

        if (withinButton) {
          return [blockedButton];
        }

        if (withinOverlay) {
          return [overlay];
        }

        return [];
      };

      expect(buildHintTargets("current-tab", "abcd", 1, false)).toHaveLength(0);
    } finally {
      fixture.cleanup();
    }
  });
});