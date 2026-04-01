import { describe, expect, test } from "bun:test";
import {
  HINT_ATTACH_ICON_PATH,
  HINT_ERASE_ICON_PATH,
  HINT_FOCUS_MODE_ICON_PATH,
  HINT_HOME_ICON_PATH,
  HINT_INPUT_ICON_PATH,
  HINT_MICROPHONE_ICON_PATH,
  HINT_SIDEBAR_ICON_PATH
} from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { parseReservedHintDirectives } from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const directiveLabels = parseReservedHintDirectives(
  `@input kj\n@erase er\n@attach up\n@microphone mic\n@sidebar we\n@home sd`
);

const expectFocusIconMarker = (
  target: ReturnType<typeof buildHintTargets>[number] | undefined
): void => {
  expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("focus-action");
  const icon = target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`);
  expect(icon?.innerHTML).toContain(HINT_FOCUS_MODE_ICON_PATH);
};

const expectDirectiveIconMarker = (
  target: ReturnType<typeof buildHintTargets>[number] | undefined,
  iconPath: string
): void => {
  expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
  expect(target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML).toContain(
    iconPath
  );
};

describe("buildHintTargets expandable markers", () => {
  test("does not treat popup menu triggers as expand or collapse controls", () => {
    const fixture = createDomFixture(`
      <div class="trailing muted-text">
        <div class="row trailing-actions">
          <button
            tabindex="0"
            class="menu-trigger"
            aria-label="Open item options"
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
          ></button>
        </div>
      </div>
    `);

    try {
      const [target] = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
      expect(target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)).toBeNull();
    } finally {
      fixture.cleanup();
    }
  });

  test("still treats disclosure buttons as expandable", () => {
    const fixture = createDomFixture(`
      <button aria-expanded="false" aria-controls="section-1" aria-label="Expand section">
        More details
      </button>
    `);

    try {
      const [target] = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      expectFocusIconMarker(target);
    } finally {
      fixture.cleanup();
    }
  });

  test("treats closed icon disclosure buttons as expandable", () => {
    const fixture = createDomFixture(`
      <div class="icon-wrap">
        <button class="icon-button" data-state="closed" type="button">
          <div class="folder-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-label="Folder icon"></svg>
          </div>
        </button>
      </div>
    `);

    try {
      const [target] = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      expectFocusIconMarker(target);
    } finally {
      fixture.cleanup();
    }
  });

  test("treats open icon disclosure buttons as expandable", () => {
    const fixture = createDomFixture(`
      <div class="icon-wrap">
        <button class="icon-button" data-state="open" type="button">
          <div class="folder-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-label="Folder icon"></svg>
          </div>
        </button>
      </div>
    `);

    try {
      const [target] = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      expectFocusIconMarker(target);
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat non-disclosure action buttons with closed state as expandable", () => {
    const fixture = createDomFixture(`
      <button
        class="round-icon-button"
        aria-label="Start a group chat"
        data-state="closed"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"></svg>
      </button>
    `);

    try {
      const [target] = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
      expect(target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)).toBeNull();
    } finally {
      fixture.cleanup();
    }
  });

  test("treats nested folder toggles as expandable but not adjacent option menus", () => {
    const fixture = createDomFixture(`
      <div class="sidebar-section">
        <button aria-expanded="true" class="section-toggle" type="button">
          <h2 class="section-label">Section</h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true"></svg>
        </button>
        <ul class="item-list">
          <li>
            <div class="item-row">
              <div class="item-main">
                <div class="item-icon-wrap">
                  <button class="icon-button" data-state="closed" type="button">
                    <div data-testid="folder-icon" class="folder-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-label="Folder icon"></svg>
                    </div>
                  </button>
                </div>
                <div class="item-title">Project A</div>
              </div>
              <div class="item-trailing">
                <button
                  class="options-trigger"
                  aria-label="Open item options"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  data-state="closed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"></svg>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const folderTargets = targets.filter((target) => target.element.className === "icon-button");
      const optionTargets = targets.filter(
        (target) => target.element.className === "options-trigger"
      );

      expect(folderTargets).toHaveLength(1);
      expect(optionTargets).toHaveLength(1);

      for (const target of folderTargets) {
        expectFocusIconMarker(target);
      }

      for (const target of optionTargets) {
        expect(target.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
        expect(target.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)).toBeNull();
      }
    } finally {
      fixture.cleanup();
    }
  });

  test("marks the strongest home candidate with the home directive icon", () => {
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

  test("marks the primary search or chat field with the input directive icon", () => {
    const fixture = createDomFixture(`
      <header>
        <input id="site-search" type="search" aria-label="Search docs" />
      </header>
      <main>
        <input id="email-field" type="email" aria-label="Email address" />
        <textarea id="chat-composer" placeholder="Message the assistant"></textarea>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const chatTarget = targets.find((target) => target.element.id === "chat-composer");
      const eraseTarget = targets.find((target) => target.directiveMatch?.directive === "erase");
      const emailTarget = targets.find((target) => target.element.id === "email-field");

      expectDirectiveIconMarker(chatTarget, HINT_INPUT_ICON_PATH);
      expect(chatTarget?.label).toBe("kj");
      expectDirectiveIconMarker(eraseTarget, HINT_ERASE_ICON_PATH);
      expect(eraseTarget?.label).toBe("er");
      expect(eraseTarget?.element).toBe(chatTarget?.element);
      expect(emailTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("marks the main sidebar toggle with the sidebar directive icon", () => {
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

  test("marks a masthead guide button as the sidebar directive", () => {
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

  test("marks attach and microphone controls", () => {
    const fixture = createDomFixture(`
      <main>
        <button
          id="attach-button"
          type="button"
          class="composer-btn"
          data-testid="composer-plus-btn"
          aria-label="Add files and more"
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
      expectDirectiveIconMarker(microphoneTarget, HINT_MICROPHONE_ICON_PATH);
      expect(microphoneTarget?.label).toBe("mic");
    } finally {
      fixture.cleanup();
    }
  });
});