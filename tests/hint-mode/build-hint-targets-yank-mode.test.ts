import { describe, expect, test } from "bun:test";
import { FILE_COPY_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const expectCopyIconMarker = (
  target: ReturnType<typeof buildHintTargets>[number] | undefined
): void => {
  expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
  expect(target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML).toContain(
    FILE_COPY_ICON_PATH
  );
};

describe("buildHintTargets yank mode markers", () => {
  test("renders copy icon markers for yank link hints", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="docs-link" href="https://example.com/docs">Docs</a>
      </main>
    `);

    try {
      const [target] = buildHintTargets("yank-link-url", "abcd", 1, false);
      expectCopyIconMarker(target);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps the copy icon for yank link hints even when the element matches another directive", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="download-link" href="https://example.com/report.csv" download aria-label="Download report">
          Download
        </a>
      </main>
    `);

    try {
      const [target] = buildHintTargets("yank-link-url", "abcd", 1, false, directiveLabels);
      expect(target?.directiveMatch?.directive).toBe("download");
      expectCopyIconMarker(target);
    } finally {
      fixture.cleanup();
    }
  });

  test("renders copy icon markers for yank image hints", () => {
    const fixture = createDomFixture(`
      <main>
        <img id="hero-image" src="https://example.com/hero.png" alt="Hero" />
      </main>
    `);

    try {
      const imageTargets = buildHintTargets("yank-image", "abcd", 1, false);
      const imageUrlTargets = buildHintTargets("yank-image-url", "abcd", 1, false);

      expectCopyIconMarker(imageTargets[0]);
      expectCopyIconMarker(imageUrlTargets[0]);
    } finally {
      fixture.cleanup();
    }
  });
});