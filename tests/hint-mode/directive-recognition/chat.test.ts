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

  test("prefers YouTube ask entry points over generic chat controls", () => {
    const fixture = createDomFixture(`
      <ytd-menu-renderer>
        <button-view-model class="you-chat-entrypoint-button">
          <button id="youtube-ask-button" aria-label="Ask" type="button">
            <div>Ask</div>
          </button>
        </button-view-model>
      </ytd-menu-renderer>
      <main>
        <a id="assistant-chat" href="/chat" aria-label="Open chat"></a>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const askTarget = targets.find((target) => target.element.id === "youtube-ask-button");
      const chatTarget = targets.find((target) => target.element.id === "assistant-chat");

      expectDirectiveIconMarker(askTarget, HINT_CHAT_ICON_PATH);
      expect(askTarget?.label).toBe("ch");
      expect(chatTarget?.directiveMatch?.directive).not.toBe("chat");
    } finally {
      fixture.cleanup();
    }
  });
});