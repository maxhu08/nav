import { describe, expect, test } from "bun:test";
import { HINT_DELETE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("delete directive recognition", () => {
  test("recognizes delete actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="delete-button" type="button" aria-label="Delete message"></button>
        <button id="archive-button" type="button" aria-label="Archive message"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const deleteTarget = targets.find(
        (target) =>
          target.element.id === "delete-button" && target.directiveMatch?.directive === "delete"
      );
      const archiveTarget = targets.find((target) => target.element.id === "archive-button");

      expectDirectiveIconMarker(deleteTarget, HINT_DELETE_ICON_PATH);
      expect(deleteTarget?.label).toBe("dd");
      expect(archiveTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});