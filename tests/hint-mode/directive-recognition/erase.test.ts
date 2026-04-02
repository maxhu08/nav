import { describe, expect, test } from "bun:test";
import { HINT_ERASE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("erase directive recognition", () => {
  test("shares the main input element while using its own label", () => {
    const fixture = createDomFixture(`
      <main>
        <input id="email-field" type="email" aria-label="Email address" />
        <textarea id="chat-composer" placeholder="Message the assistant"></textarea>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const inputTarget = targets.find((target) => target.directiveMatch?.directive === "input");
      const eraseTarget = targets.find((target) => target.directiveMatch?.directive === "erase");

      expectDirectiveIconMarker(eraseTarget, HINT_ERASE_ICON_PATH);
      expect(eraseTarget?.label).toBe("er");
      expect(eraseTarget?.element).toBe(inputTarget?.element);
    } finally {
      fixture.cleanup();
    }
  });
});