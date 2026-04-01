import { describe, expect, test } from "bun:test";
import { HINT_DOWNLOAD_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("download directive recognition", () => {
  test("recognizes download links and buttons", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="download-link" href="/report.csv" download aria-label="Download report"></a>
        <button id="export-button" type="button" aria-label="Export data"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const downloadTarget = targets.find((target) => target.element.id === "download-link");
      const exportTarget = targets.find((target) => target.element.id === "export-button");

      expectDirectiveIconMarker(downloadTarget, HINT_DOWNLOAD_ICON_PATH);
      expect(downloadTarget?.label).toBe("dl");
      expect(exportTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});