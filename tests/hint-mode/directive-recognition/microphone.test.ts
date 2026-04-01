import { describe, expect, test } from "bun:test";
import { HINT_MICROPHONE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("microphone directive recognition", () => {
  test("recognizes microphone controls near the composer", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="attach-button" type="button" aria-label="Add files and more"></button>
        <textarea id="chat-composer" placeholder="Message the assistant"></textarea>
        <button id="mic-button" type="button" aria-label="Use microphone"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const microphoneTarget = targets.find((target) => target.element.id === "mic-button");

      expectDirectiveIconMarker(microphoneTarget, HINT_MICROPHONE_ICON_PATH);
      expect(microphoneTarget?.label).toBe("mic");
    } finally {
      fixture.cleanup();
    }
  });

  test("recognizes dictation controls", () => {
    const fixture = createDomFixture(`
      <main>
        <button
          id="dictation-button"
          type="button"
          class="composer-btn"
          aria-label="Start dictation"
        ></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const microphoneTarget = targets.find(
        (target) =>
          target.element.id === "dictation-button" &&
          target.directiveMatch?.directive === "microphone"
      );

      expectDirectiveIconMarker(microphoneTarget, HINT_MICROPHONE_ICON_PATH);
      expect(microphoneTarget?.label).toBe("mic");
    } finally {
      fixture.cleanup();
    }
  });
});