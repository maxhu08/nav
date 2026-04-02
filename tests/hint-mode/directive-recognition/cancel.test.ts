import { describe, expect, test } from "bun:test";
import { HINT_CANCEL_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("cancel directive recognition", () => {
  test("recognizes cancel actions", () => {
    const fixture = createDomFixture(`
      <dialog open>
        <button id="cancel-button" type="button">Cancel</button>
        <button id="help-button" type="button">Help</button>
      </dialog>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const cancelTarget = targets.find((target) => target.element.id === "cancel-button");
      const helpTarget = targets.find((target) => target.element.id === "help-button");

      expectDirectiveIconMarker(cancelTarget, HINT_CANCEL_ICON_PATH);
      expect(cancelTarget?.label).toBe("no");
      expect(helpTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat home navigation links as cancel", () => {
    const fixture = createDomFixture(`
      <main>
        <a
          id="home-link"
          data-sidebar-item="true"
          aria-label="Home"
          class="sidebar-link"
          href="/"
        ></a>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const cancelTarget = targets.find(
        (target) =>
          target.element.id === "home-link" && target.directiveMatch?.directive === "cancel"
      );

      expect(cancelTarget).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat sidebar header controls as cancel", () => {
    const fixture = createDomFixture(`
      <div class="sidebar-shell">
        <div id="sidebar-header" class="sidebar-header">
          <a
            id="home-link"
            data-sidebar-item="true"
            aria-label="Home"
            class="sidebar-link"
            href="/"
          ></a>
          <div class="sidebar-actions">
            <button
              id="close-sidebar-button"
              type="button"
              aria-expanded="true"
              aria-controls="stage-slideover-sidebar"
              aria-label="Close sidebar"
              data-testid="close-sidebar-button"
              data-state="closed"
            ></button>
          </div>
        </div>
        <aside id="stage-slideover-sidebar"></aside>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const cancelTargets = targets.filter(
        (target) =>
          (target.element.id === "home-link" || target.element.id === "close-sidebar-button") &&
          target.directiveMatch?.directive === "cancel"
      );

      expect(cancelTargets).toHaveLength(0);
    } finally {
      fixture.cleanup();
    }
  });
});