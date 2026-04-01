import { describe, expect, test } from "bun:test";
import { HINT_SHARE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("share directive recognition", () => {
  test("prefers share controls over nearby generic actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="share-button" type="button" aria-label="Share this page"></button>
        <button id="follow-button" type="button" aria-label="Follow author"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const shareTarget = targets.find((target) => target.element.id === "share-button");
      const followTarget = targets.find((target) => target.element.id === "follow-button");

      expectDirectiveIconMarker(shareTarget, HINT_SHARE_ICON_PATH);
      expect(shareTarget?.label).toBe("sh");
      expect(followTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat composer dictation and send controls as share", () => {
    const fixture = createDomFixture(`
      <main>
        <div class="composer-trailing">
          <button
            id="dictation-button"
            type="button"
            class="composer-btn"
            aria-label="Start dictation"
          ></button>
          <button
            id="composer-submit-button"
            aria-label="Send prompt"
            data-testid="send-button"
            class="composer-submit-btn"
          ></button>
        </div>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const shareTargets = targets.filter(
        (target) =>
          (target.element.id === "dictation-button" ||
            target.element.id === "composer-submit-button") &&
          target.directiveMatch?.directive === "share"
      );

      expect(shareTargets).toHaveLength(0);
    } finally {
      fixture.cleanup();
    }
  });
});