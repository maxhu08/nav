import { describe, expect, test } from "bun:test";
import { HINT_DISLIKE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("dislike directive recognition", () => {
  test("recognizes dislike actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="dislike-button" type="button" aria-label="Dislike"></button>
        <button id="details-button" type="button" aria-label="Details"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const dislikeTarget = targets.find((target) => target.element.id === "dislike-button");
      const detailsTarget = targets.find((target) => target.element.id === "details-button");

      expectDirectiveIconMarker(dislikeTarget, HINT_DISLIKE_ICON_PATH);
      expect(dislikeTarget?.label).toBe("oi");
      expect(detailsTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});