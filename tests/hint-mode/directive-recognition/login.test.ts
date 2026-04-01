import { describe, expect, test } from "bun:test";
import { HINT_LOGIN_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("login directive recognition", () => {
  test("recognizes sign in entry points", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="login-link" href="/login">Continue</a>
        <button id="help-button" type="button" aria-label="Help"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const loginTarget = targets.find((target) => target.element.id === "login-link");
      const helpTarget = targets.find((target) => target.element.id === "help-button");

      expectDirectiveIconMarker(loginTarget, HINT_LOGIN_ICON_PATH);
      expect(loginTarget?.label).toBe("si");
      expect(helpTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});