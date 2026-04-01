import { describe, expect, test } from "bun:test";
import { HINT_SIDEBAR_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("sidebar directive recognition", () => {
  test("prefers the main sidebar toggle over row menus", () => {
    const fixture = createDomFixture(`
      <header>
        <button
          id="main-sidebar-toggle"
          type="button"
          aria-label="Toggle sidebar"
          aria-controls="app-sidebar"
          aria-expanded="false"
        ></button>
      </header>
      <aside id="app-sidebar"></aside>
      <main>
        <button id="row-menu" type="button" aria-label="Open item options" aria-haspopup="menu"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find((target) => target.element.id === "main-sidebar-toggle");
      const rowMenuTarget = targets.find((target) => target.element.id === "row-menu");

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");
      expect(rowMenuTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("recognizes a masthead guide button as the sidebar directive", () => {
    const fixture = createDomFixture(`
      <yt-icon-button id="guide-button" toggleable="true" class="masthead-shell">
        <button id="button" aria-label="Guide" aria-pressed="false">
          <yt-icon id="guide-icon"></yt-icon>
        </button>
      </yt-icon-button>
      <main>
        <button id="row-menu" type="button" aria-label="Open item options" aria-haspopup="menu"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find((target) => target.element.id === "button");
      const rowMenuTarget = targets.find((target) => target.element.id === "row-menu");

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");
      expect(rowMenuTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});