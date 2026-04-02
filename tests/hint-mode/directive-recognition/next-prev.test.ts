import { describe, expect, test } from "bun:test";
import {
  HINT_ATTACH_ICON_PATH,
  HINT_NEXT_ICON_PATH,
  HINT_PREV_ICON_PATH
} from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("next and prev directive recognition", () => {
  test("matches the same targets as follow-prev and follow-next", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="older-posts" href="/page/1">Older posts</a>
        <button id="open-settings" type="button" aria-label="Open settings"></button>
        <a id="next-page" href="/page/3" rel="next">Next</a>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const prevTarget = targets.find((target) => target.element.id === "older-posts");
      const nextTarget = targets.find((target) => target.element.id === "next-page");
      const settingsTarget = targets.find((target) => target.element.id === "open-settings");

      expectDirectiveIconMarker(prevTarget, HINT_PREV_ICON_PATH);
      expect(prevTarget?.label).toBe("lk");
      expectDirectiveIconMarker(nextTarget, HINT_NEXT_ICON_PATH);
      expect(nextTarget?.label).toBe("kl");
      expect(settingsTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not override a stronger directive on the same element", () => {
    const fixture = createDomFixture(`
      <main>
        <div class="leading-slot">
          <button
            id="composer-plus-btn"
            type="button"
            class="composer-btn"
            data-testid="composer-plus-btn"
            aria-label="Add files and more"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
          ></button>
        </div>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const attachTarget = targets.find(
        (target) =>
          target.element.id === "composer-plus-btn" && target.directiveMatch?.directive === "attach"
      );
      const nextTarget = targets.find(
        (target) =>
          target.element.id === "composer-plus-btn" && target.directiveMatch?.directive === "next"
      );

      expectDirectiveIconMarker(attachTarget, HINT_ATTACH_ICON_PATH);
      expect(attachTarget?.label).toBe("up");
      expect(nextTarget).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });
});