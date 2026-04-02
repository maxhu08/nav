import { describe, expect, test } from "bun:test";
import { HINT_MORE_ICON_PATH, HINT_SIDEBAR_ICON_PATH } from "~/src/lib/inline-icons";
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
      expect(rowMenuTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("inline-icon");
      expect(
        rowMenuTarget?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_MORE_ICON_PATH);
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
      expect(rowMenuTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("inline-icon");
      expect(
        rowMenuTarget?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_MORE_ICON_PATH);
    } finally {
      fixture.cleanup();
    }
  });

  test("recognizes an explicit close sidebar control", () => {
    const fixture = createDomFixture(`
      <main>
        <button
          id="close-sidebar-button"
          type="button"
          class="sidebar-resize-button"
          aria-expanded="true"
          aria-controls="app-slideover-sidebar"
          aria-label="Close sidebar"
          data-testid="close-sidebar-button"
          data-state="closed"
        ></button>
        <aside id="app-slideover-sidebar"></aside>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find(
        (target) =>
          target.element.id === "close-sidebar-button" &&
          target.directiveMatch?.directive === "sidebar"
      );

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat settings dropdown triggers as sidebar directives", () => {
    const fixture = createDomFixture(`
      <action-menu class="contribution-settings-menu">
        <button
          id="settings-menu-button"
          popovertarget="settings-menu-overlay"
          aria-controls="settings-menu-list"
          aria-haspopup="true"
          type="button"
          class="settings-link button"
        >
          <span class="button-label">Contribution settings</span>
          <span class="button-trailing-visual">
            <svg aria-hidden="true" class="triangle-down">
              <path d="M4 6L8 10L12 6"></path>
            </svg>
          </span>
        </button>
      </action-menu>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const settingsTarget = targets.find((target) => target.element.id === "settings-menu-button");

      expect(settingsTarget?.directiveMatch?.directive).not.toBe("sidebar");
      expect(settingsTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).not.toBe("directive");
    } finally {
      fixture.cleanup();
    }
  });

  test("still recognizes header hamburger buttons that open dialogs as sidebar directives", () => {
    const fixture = createDomFixture(`
      <header class="app-header">
        <span id="app-nav-label">Open navigation</span>
        <button
          id="header-nav-button"
          type="button"
          aria-haspopup="dialog"
          aria-labelledby="app-nav-label"
          class="app-header-button"
        >
          <svg aria-hidden="true" class="octicon-three-bars">
            <path d="M1 3H15M1 8H15M1 13H15"></path>
          </svg>
        </button>
      </header>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find((target) => target.element.id === "header-nav-button");

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");
    } finally {
      fixture.cleanup();
    }
  });

  test("recognizes github-style app header nav buttons from aria-labelledby text", () => {
    const fixture = createDomFixture(`
      <header class="styles-module__appHeader__shell">
        <span id="header-nav-label">Open navigation menu</span>
        <button
          id="github-header-nav-button"
          data-component="IconButton"
          type="button"
          aria-haspopup="dialog"
          class="app-header-button"
          aria-labelledby="header-nav-label"
        >
          <svg aria-hidden="true" class="octicon octicon-three-bars">
            <path d="M1 3H15M1 8H15M1 13H15"></path>
          </svg>
        </button>
      </header>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find(
        (target) => target.element.id === "github-header-nav-button"
      );

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");
    } finally {
      fixture.cleanup();
    }
  });

  test("recognizes github-style sidebar close buttons inside the nav dialog", () => {
    const fixture = createDomFixture(`
      <div
        role="dialog"
        aria-labelledby="global-nav-title"
        aria-modal="true"
        data-position-regular="left"
        class="nav-dialog"
      >
        <h2 id="global-nav-title">Global Navigation Menu</h2>
        <button
          id="github-close-nav-button"
          data-component="IconButton"
          type="button"
          class="nav-close-button"
          aria-labelledby="close-menu-label"
        >
          <svg aria-hidden="true" class="octicon octicon-x">
            <path d="M3 3L13 13M13 3L3 13"></path>
          </svg>
        </button>
        <span id="close-menu-label">Close menu</span>
        <nav>
          <a data-testid="side-nav-menu-item-HOME" href="/dashboard">Home</a>
        </nav>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const sidebarTarget = targets.find(
        (target) => target.element.id === "github-close-nav-button"
      );

      expectDirectiveIconMarker(sidebarTarget, HINT_SIDEBAR_ICON_PATH);
      expect(sidebarTarget?.label).toBe("we");
    } finally {
      fixture.cleanup();
    }
  });
});