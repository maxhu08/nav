import { describe, expect, test } from "bun:test";
import { HINT_NOTIFICATION_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("notification directive recognition", () => {
  test("recognizes notification tray buttons", () => {
    const fixture = createDomFixture(`
      <header>
        <button id="notification-button" type="button" aria-label="Notifications"></button>
      </header>
      <main>
        <button id="settings-button" type="button" aria-label="Open settings"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const notificationTarget = targets.find(
        (target) =>
          target.element.id === "notification-button" &&
          target.directiveMatch?.directive === "notification"
      );
      const settingsTarget = targets.find((target) => target.element.id === "settings-button");

      expectDirectiveIconMarker(notificationTarget, HINT_NOTIFICATION_ICON_PATH);
      expect(notificationTarget?.label).toBe("nf");
      expect(settingsTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});