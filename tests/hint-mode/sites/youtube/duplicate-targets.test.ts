import { describe, expect, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("YouTube duplicate hint target regressions", () => {
  test("keeps only the real join button target inside button-like wrappers", () => {
    const fixture = createDomFixture(`
      <div id="membership-action">
        <timed-animation-button-renderer class="button-renderer-host">
          <yt-smartimation>
            <div class="smartimation__content">
              <ytd-button-renderer>
                <yt-button-shape>
                  <button aria-label="Join channel" aria-disabled="false">
                    <span role="text">Join</span>
                  </button>
                </yt-button-shape>
              </ytd-button-renderer>
            </div>
          </yt-smartimation>
        </timed-animation-button-renderer>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "asdf", 1, false);

      expect(targets).toHaveLength(1);
      expect(targets[0]?.element.tagName).toBe("BUTTON");
      expect(targets[0]?.element.getAttribute("aria-label")).toBe("Join channel");
    } finally {
      fixture.cleanup();
    }
  });

  test("ignores empty notification placeholders next to the real button", () => {
    const fixture = createDomFixture(`
      <div class="smartimation__content">
        <div id="notification-placeholder" class="style-scope subscribe-button-renderer"></div>
        <div id="notification-action" class="style-scope subscribe-button-renderer">
          <ytd-subscription-notification-toggle-button-renderer-next class="style-scope subscribe-button-renderer">
            <yt-button-shape>
              <button aria-label="Change notification setting for Generic Channel"></button>
            </yt-button-shape>
          </ytd-subscription-notification-toggle-button-renderer-next>
        </div>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "asdf", 1, false);

      expect(targets).toHaveLength(1);
      expect(targets[0]?.element.tagName).toBe("BUTTON");
      expect(targets[0]?.element.getAttribute("aria-label")).toBe(
        "Change notification setting for Generic Channel"
      );
    } finally {
      fixture.cleanup();
    }
  });
});