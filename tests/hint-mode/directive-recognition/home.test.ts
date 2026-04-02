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
});