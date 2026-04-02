import { describe, expect, test } from "bun:test";
import { HINT_ATTACH_ICON_PATH, HINT_MORE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("attach directive recognition", () => {
  test("recognizes composer plus controls as attach targets", () => {
    const fixture = createDomFixture(`
      <main>
        <button
          id="attach-button"
          type="button"
          class="composer-btn"
          data-testid="composer-plus-btn"
          aria-label="Add files and more"
          aria-haspopup="menu"
          aria-expanded="false"
        ></button>
        <textarea id="chat-composer" placeholder="Message the assistant"></textarea>
        <button id="mic-button" type="button" aria-label="Use microphone"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const attachTarget = targets.find((target) => target.element.id === "attach-button");
      const microphoneTarget = targets.find((target) => target.element.id === "mic-button");

      expectDirectiveIconMarker(attachTarget, HINT_ATTACH_ICON_PATH);
      expect(attachTarget?.label).toBe("up");
      expect(microphoneTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat generic more actions menus as attach", () => {
    const fixture = createDomFixture(`
      <main>
        <div class="shorts-overlay image-overlay-text">
          <button
            id="more-actions"
            type="button"
            class="icon-button"
            aria-label="More actions"
          ></button>
        </div>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false);
      const attachTarget = targets.find(
        (target) =>
          target.element.id === "more-actions" && target.directiveMatch?.directive === "attach"
      );
      const moreActionsTarget = targets.find((target) => target.element.id === "more-actions");

      expect(attachTarget).toBeUndefined();
      expect(moreActionsTarget?.directiveMatch).toBeUndefined();
      expect(moreActionsTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("inline-icon");
      expect(
        moreActionsTarget?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_MORE_ICON_PATH);
    } finally {
      fixture.cleanup();
    }
  });
});