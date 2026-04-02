import { describe, expect, test } from "bun:test";
import { HINT_FOCUS_MODE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const expectFocusIconMarker = (
  target: ReturnType<typeof buildHintTargets>[number] | undefined
): void => {
  expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("focus-action");
  const icon = target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`);
  expect(icon?.innerHTML).toContain(HINT_FOCUS_MODE_ICON_PATH);
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
      const [target] = buildHintTargets("current-tab", "abcd", 1, false);
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
      const [target] = buildHintTargets("current-tab", "abcd", 1, false);
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
      const [target] = buildHintTargets("current-tab", "abcd", 1, false);
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
      const [target] = buildHintTargets("current-tab", "abcd", 1, false);
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
      const [target] = buildHintTargets("current-tab", "abcd", 1, false);
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
      const targets = buildHintTargets("current-tab", "abcd", 1, false);
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

  test("prefers inner links over outer expandable containers", () => {
    const fixture = createDomFixture(`
      <ytd-guide-entry-renderer
        id="collapser-item"
        role="button"
        aria-expanded="true"
      >
        <a id="endpoint" href="/playlist?list=LL" role="link" title="Show less">
          <tp-yt-paper-item id="guide-entry" role="link" tabindex="0" aria-disabled="false">
            <yt-formatted-string class="title">Show less</yt-formatted-string>
          </tp-yt-paper-item>
        </a>
      </ytd-guide-entry-renderer>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false);

      expect(targets).toHaveLength(1);
      expect(targets[0]?.element.id).toBe("endpoint");
      expect(targets[0]?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
      expect(targets[0]?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)).toBeNull();
    } finally {
      fixture.cleanup();
    }
  });
});