import { describe, expect, test } from "bun:test";
import { HINT_LIKE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("like directive recognition", () => {
  test("recognizes like actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="like-button" type="button" aria-label="Like"></button>
        <button id="open-button" type="button" aria-label="Open details"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const likeTarget = targets.find((target) => target.element.id === "like-button");
      const openTarget = targets.find((target) => target.element.id === "open-button");

      expectDirectiveIconMarker(likeTarget, HINT_LIKE_ICON_PATH);
      expect(likeTarget?.label).toBe("iu");
      expect(openTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});