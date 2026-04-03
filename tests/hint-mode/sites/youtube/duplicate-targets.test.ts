import { describe, expect, test } from "bun:test";
import {
  MARKER_VARIANT_ATTRIBUTE,
  MARKER_ICON_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import {
  HINT_DISLIKE_ICON_PATH,
  HINT_LIKE_ICON_PATH,
  HINT_SHARE_ICON_PATH
} from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";

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

  test("keeps one hint per Shorts action button when the count label sits beside the real button", () => {
    const fixture = createDomFixture(`
      <div id="button-bar">
        <reel-action-bar-view-model>
          <like-button-view-model>
            <toggle-button-view-model>
              <button-view-model>
                <label class="yt-spec-button-shape-with-label">
                  <button
                    class="yt-spec-button-shape-next"
                    aria-pressed="false"
                    aria-label="like this video along with 34 thousand other people"
                    aria-disabled="false"
                  ></button>
                  <div class="yt-spec-button-shape-with-label__label" aria-hidden="false">
                    <span role="text">34K</span>
                  </div>
                </label>
              </button-view-model>
            </toggle-button-view-model>
          </like-button-view-model>
        </reel-action-bar-view-model>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "asdf", 1, false);

      expect(targets).toHaveLength(1);
      expect(targets[0]?.element.tagName).toBe("BUTTON");
      expect(targets[0]?.element.getAttribute("aria-label")).toBe(
        "like this video along with 34 thousand other people"
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps directive markers on Shorts action buttons instead of falling back to regular hints", () => {
    const fixture = createDomFixture(`
      <div id="button-bar">
        <reel-action-bar-view-model>
          <like-button-view-model>
            <toggle-button-view-model>
              <button-view-model>
                <label class="yt-spec-button-shape-with-label">
                  <button
                    id="like-button"
                    class="yt-spec-button-shape-next"
                    aria-label="like this video along with 34 thousand other people"
                    aria-disabled="false"
                  ></button>
                  <div class="yt-spec-button-shape-with-label__label" aria-hidden="false">
                    <span role="text">34K</span>
                  </div>
                </label>
              </button-view-model>
            </toggle-button-view-model>
          </like-button-view-model>
          <dislike-button-view-model>
            <toggle-button-view-model>
              <button-view-model>
                <label class="yt-spec-button-shape-with-label">
                  <button
                    id="dislike-button"
                    class="yt-spec-button-shape-next"
                    aria-label="Dislike this video"
                    aria-disabled="false"
                  ></button>
                  <div class="yt-spec-button-shape-with-label__label" aria-hidden="false">
                    <span role="text">Dislike</span>
                  </div>
                </label>
              </button-view-model>
            </toggle-button-view-model>
          </dislike-button-view-model>
          <button-view-model>
            <label class="yt-spec-button-shape-with-label">
              <button
                id="share-button"
                class="yt-spec-button-shape-next"
                aria-label="Share"
                aria-disabled="false"
              ></button>
              <div class="yt-spec-button-shape-with-label__label" aria-hidden="false">
                <span role="text">Share</span>
              </div>
            </label>
          </button-view-model>
        </reel-action-bar-view-model>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const likeTarget = targets.find((target) => target.element.id === "like-button");
      const dislikeTarget = targets.find((target) => target.element.id === "dislike-button");
      const shareTarget = targets.find((target) => target.element.id === "share-button");

      expect(targets).toHaveLength(3);

      expect(likeTarget?.label).toBe("iu");
      expect(likeTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
      expect(
        likeTarget?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_LIKE_ICON_PATH);

      expect(dislikeTarget?.label).toBe("oi");
      expect(dislikeTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
      expect(
        dislikeTarget?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_DISLIKE_ICON_PATH);

      expect(shareTarget?.label).toBe("sh");
      expect(shareTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
      expect(
        shareTarget?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML
      ).toContain(HINT_SHARE_ICON_PATH);
    } finally {
      fixture.cleanup();
    }
  });
});