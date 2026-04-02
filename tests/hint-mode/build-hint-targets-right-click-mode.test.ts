import { describe, expect, test } from "bun:test";
import { HINT_CURSOR_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

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
});