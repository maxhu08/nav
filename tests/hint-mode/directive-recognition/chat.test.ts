import { describe, expect, test } from "bun:test";
import { HINT_CHAT_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("chat directive recognition", () => {
  test("recognizes chat entry points", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="assistant-chat" href="/chat" aria-label="Open chat"></a>
        <button id="settings-button" type="button" aria-label="Open settings"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const chatTarget = targets.find((target) => target.element.id === "assistant-chat");
      const settingsTarget = targets.find((target) => target.element.id === "settings-button");

      expectDirectiveIconMarker(chatTarget, HINT_CHAT_ICON_PATH);
      expect(chatTarget?.label).toBe("ch");
      expect(settingsTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});