import { describe, expect, test } from "bun:test";
import { HINT_INPUT_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("input directive recognition", () => {
  test("prefers the main search or chat field", () => {
    const fixture = createDomFixture(`
      <header>
        <input id="site-search" type="search" aria-label="Search docs" />
      </header>
      <main>
        <input id="email-field" type="email" aria-label="Email address" />
        <textarea id="chat-composer" placeholder="Message the assistant"></textarea>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const chatTarget = targets.find((target) => target.element.id === "chat-composer");
      const emailTarget = targets.find((target) => target.element.id === "email-field");

      expectDirectiveIconMarker(chatTarget, HINT_INPUT_ICON_PATH);
      expect(chatTarget?.label).toBe("kj");
      expect(emailTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});