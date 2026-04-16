import { describe, expect, test } from "bun:test";
import { HINT_HOME_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("home directive recognition", () => {
  test("prefers the strongest home candidate", () => {
    const fixture = createDomFixture(`
      <a id="root-link" href="/">Dashboard</a>
      <button id="secondary-home" type="button" class="nav-home">Open panel</button>
      <button id="primary-home" type="button" aria-label="Home">Go</button>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const primaryHomeTarget = targets.find((target) => target.element.id === "primary-home");
      const rootLinkTarget = targets.find((target) => target.element.id === "root-link");

      expectDirectiveIconMarker(primaryHomeTarget, HINT_HOME_ICON_PATH);
      expect(primaryHomeTarget?.label).toBe("sd");
      expect(rootLinkTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat generic title text as a home action", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="title-link" href="/watch?v=1">alpha home cactus</a>
        <button id="primary-home" type="button" aria-label="Home">Go</button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const titleHomeTarget = targets.find(
        (target) =>
          target.element.id === "title-link" && target.directiveMatch?.directive === "home"
      );
      const primaryHomeTarget = targets.find(
        (target) =>
          target.element.id === "primary-home" && target.directiveMatch?.directive === "home"
      );

      expect(titleHomeTarget).toBeUndefined();
      expectDirectiveIconMarker(primaryHomeTarget, HINT_HOME_ICON_PATH);
      expect(primaryHomeTarget?.label).toBe("sd");
    } finally {
      fixture.cleanup();
    }
  });
});