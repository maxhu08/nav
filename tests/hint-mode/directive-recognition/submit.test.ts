import { describe, expect, test } from "bun:test";
import { HINT_SUBMIT_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("submit directive recognition", () => {
  test("recognizes submit actions", () => {
    const fixture = createDomFixture(`
      <form>
        <input id="submit-button" type="submit" value="Send" />
        <button id="preview-button" type="button">Preview</button>
      </form>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const submitTarget = targets.find((target) => target.element.id === "submit-button");
      const previewTarget = targets.find((target) => target.element.id === "preview-button");

      expectDirectiveIconMarker(submitTarget, HINT_SUBMIT_ICON_PATH);
      expect(submitTarget?.label).toBe("ok");
      expect(previewTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});