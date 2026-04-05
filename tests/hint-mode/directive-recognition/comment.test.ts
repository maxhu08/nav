import { describe, expect, test } from "bun:test";
import { HINT_COMMENT_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("comment directive recognition", () => {
  test("recognizes comment and reply entry points", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="comment-button" type="button" aria-label="Write a comment"></button>
        <button id="settings-button" type="button" aria-label="Open settings"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const commentTarget = targets.find((target) => target.element.id === "comment-button");
      const settingsTarget = targets.find((target) => target.element.id === "settings-button");

      expectDirectiveIconMarker(commentTarget, HINT_COMMENT_ICON_PATH);
      expect(commentTarget?.label).toBe("km");
      expect(settingsTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});