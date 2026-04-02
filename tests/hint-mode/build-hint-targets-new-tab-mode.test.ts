import { describe, expect, test } from "bun:test";
import { EXTERNAL_LINK_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

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
});