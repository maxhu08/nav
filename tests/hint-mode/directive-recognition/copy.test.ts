import { describe, expect, test } from "bun:test";
import { FILE_COPY_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("copy directive recognition", () => {
  test("recognizes copy actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="copy-button" type="button" aria-label="Copy link"></button>
        <button id="open-button" type="button" aria-label="Open link"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const copyTarget = targets.find((target) => target.element.id === "copy-button");
      const openTarget = targets.find((target) => target.element.id === "open-button");

      expectDirectiveIconMarker(copyTarget, FILE_COPY_ICON_PATH);
      expect(copyTarget?.label).toBe("cp");
      expect(openTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("prefers copy response over copy message on turn actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button
          id="copy-message"
          type="button"
          aria-label="Copy message"
          data-testid="copy-turn-action-button"
          data-state="closed"
        ></button>
        <button
          id="copy-response"
          type="button"
          aria-label="Copy response"
          data-testid="copy-turn-action-button"
          data-state="closed"
        ></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const copyResponseTarget = targets.find(
        (target) =>
          target.element.id === "copy-response" && target.directiveMatch?.directive === "copy"
      );
      const copyMessageCopyTarget = targets.find(
        (target) =>
          target.element.id === "copy-message" && target.directiveMatch?.directive === "copy"
      );

      expectDirectiveIconMarker(copyResponseTarget, FILE_COPY_ICON_PATH);
      expect(copyResponseTarget?.label).toBe("cp");
      expect(copyMessageCopyTarget).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });
});