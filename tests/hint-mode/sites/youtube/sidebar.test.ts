import { describe, expect, test } from "bun:test";
import { HINT_SIDEBAR_ICON_PATH } from "~/src/lib/inline-icons";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("YouTube sidebar directive regressions", () => {
  test("prefers the masthead guide button over the mini-guide You menu button", () => {
    const fixture = createDomFixture(`
      <ytd-masthead>
        <yt-icon-button id="guide-button" toggleable="true" class="style-scope ytd-masthead">
          <button id="masthead-guide-button" class="style-scope yt-icon-button" aria-label="Guide">
            <yt-icon id="guide-icon" class="style-scope ytd-masthead"></yt-icon>
          </button>
        </yt-icon-button>
      </ytd-masthead>
      <ytd-mini-guide-entry-renderer
        class="style-scope ytd-mini-guide-renderer"
        frosted-glass=""
        ally-show-menu-on-tap=""
      >
        <a
          id="endpoint"
          class="yt-simple-endpoint style-scope ytd-mini-guide-entry-renderer"
          aria-selected="false"
          aria-label="You"
          title="You"
          href="/feed/you"
        >
          <span class="title style-scope ytd-mini-guide-entry-renderer">You</span>
        </a>
        <span class="style-scope ytd-mini-guide-entry-renderer">
          <button
            type="button"
            id="ally-menu-button"
            class="ally-menu-button style-scope ytd-mini-guide-entry-renderer"
            aria-haspopup="true"
            aria-expanded="false"
            aria-label="You"
          ></button>
        </span>
      </ytd-mini-guide-entry-renderer>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find((target) => target.element.id === "masthead-guide-button");
      const miniGuideMenuTarget = targets.find(
        (target) => target.element.id === "ally-menu-button"
      );

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");

      expect(miniGuideMenuTarget).toBeDefined();
      expect(miniGuideMenuTarget?.directiveMatch?.directive).not.toBe("sidebar");
      expect(miniGuideMenuTarget?.label).not.toBe("we");
      expect(miniGuideMenuTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).not.toBe(
        "directive"
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("prefers the masthead guide button over other sidebar candidates", () => {
    const fixture = createDomFixture(`
      <ytd-masthead>
        <yt-icon-button id="guide-button" toggleable="true" class="style-scope ytd-masthead">
          <button id="masthead-guide-button" class="style-scope yt-icon-button" aria-label="Guide">
            <yt-icon id="guide-icon" class="style-scope ytd-masthead"></yt-icon>
          </button>
        </yt-icon-button>
      </ytd-masthead>
      <header>
        <button
          id="generic-sidebar-toggle"
          type="button"
          aria-label="Toggle sidebar"
          aria-controls="app-sidebar"
          aria-expanded="false"
        ></button>
      </header>
      <aside id="app-sidebar"></aside>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find((target) => target.element.id === "masthead-guide-button");
      const genericTarget = targets.find(
        (target) => target.element.id === "generic-sidebar-toggle"
      );

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");
      expect(genericTarget?.directiveMatch?.directive).not.toBe("sidebar");
      expect(genericTarget?.label).not.toBe("we");
      expect(genericTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).not.toBe("directive");
    } finally {
      fixture.cleanup();
    }
  });
});