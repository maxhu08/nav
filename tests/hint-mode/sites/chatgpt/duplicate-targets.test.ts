import { describe, expect, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("ChatGPT duplicate hint target regressions", () => {
  test("keeps only the real composer upload button target", () => {
    const fixture = createDomFixture(`
      <div class="composer-shell">
        <form class="group/composer" data-type="unified-composer">
          <div data-composer-surface="true">
            <div class="leading">
              <label id="composer-plus-label" class="composer-btn-shell">
                <button
                  type="button"
                  class="composer-btn"
                  data-testid="composer-plus-btn"
                  aria-label="Add files and more"
                  id="composer-plus-btn"
                ></button>
                <input id="composer-file-input" type="file" />
              </label>
            </div>

            <div class="primary">
              <div
                contenteditable="true"
                translate="no"
                class="ProseMirror"
                id="prompt-textarea"
                role="textbox"
                aria-multiline="true"
                aria-label="Chat with ChatGPT"
              >
                <p><br /></p>
              </div>
            </div>
          </div>
        </form>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      const uploadTargets = targets.filter((target) =>
        ["composer-plus-btn", "composer-plus-label", "composer-file-input"].includes(
          target.element.id
        )
      );

      expect(uploadTargets).toHaveLength(1);
      expect(uploadTargets[0]?.element.id).toBe("composer-plus-btn");
    } finally {
      fixture.cleanup();
    }
  });

  test("suppresses clickable upload wrappers around the composer plus button", () => {
    const fixture = createDomFixture(`
      <div class="composer-shell">
        <form class="group/composer" data-type="unified-composer">
          <div data-composer-surface="true">
            <div class="leading">
              <div id="outer-upload-wrapper" class="composer-btn-shell" tabindex="0">
                <label id="inner-upload-wrapper" class="composer-btn-shell" tabindex="0">
                  <button
                    type="button"
                    class="composer-btn"
                    data-testid="composer-plus-btn"
                    aria-label="Add files and more"
                    id="composer-plus-btn"
                  ></button>
                  <input id="composer-file-input" type="file" />
                </label>
              </div>
            </div>

            <div class="primary">
              <div
                contenteditable="true"
                translate="no"
                class="ProseMirror"
                id="prompt-textarea"
                role="textbox"
                aria-multiline="true"
                aria-label="Chat with ChatGPT"
              >
                <p><br /></p>
              </div>
            </div>
          </div>
        </form>
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "asdfgh", 1, false);
      const uploadTargets = targets.filter((target) =>
        [
          "composer-plus-btn",
          "outer-upload-wrapper",
          "inner-upload-wrapper",
          "composer-file-input"
        ].includes(target.element.id)
      );

      expect(uploadTargets).toHaveLength(1);
      expect(uploadTargets[0]?.element.id).toBe("composer-plus-btn");
    } finally {
      fixture.cleanup();
    }
  });

  test("suppresses sibling ChatGPT composer file inputs outside the form", () => {
    const fixture = createDomFixture(`
      <div class="composer-region">
        <form class="group/composer w-full" data-type="unified-composer">
          <div class="hidden">
            <input multiple type="file" tabindex="-1" id="upload-files" />
          </div>
          <div data-composer-surface="true">
            <div class="leading">
              <span class="flex" data-state="closed">
                <button
                  type="button"
                  class="composer-btn"
                  data-testid="composer-plus-btn"
                  aria-label="Add files and more"
                  id="composer-plus-btn"
                  aria-haspopup="menu"
                  aria-expanded="false"
                ></button>
              </span>
            </div>

            <div class="primary">
              <div
                contenteditable="true"
                translate="no"
                class="ProseMirror"
                id="prompt-textarea"
                role="textbox"
                aria-multiline="true"
                aria-label="Chat with ChatGPT"
              >
                <p>2</p>
              </div>
            </div>
          </div>
        </form>

        <input
          class="sr-only select-none"
          type="file"
          tabindex="-1"
          aria-hidden="true"
          id="upload-photos"
          accept="image/*"
          multiple
        />
        <input
          class="sr-only select-none"
          type="file"
          tabindex="-1"
          aria-hidden="true"
          id="upload-camera"
          accept="image/*"
          capture="environment"
          multiple
        />
      </div>
    `);

    try {
      const targets = buildHintTargets("current-tab", "asdfgh", 1, false);
      const uploadTargets = targets.filter((target) =>
        ["composer-plus-btn", "upload-files", "upload-photos", "upload-camera"].includes(
          target.element.id
        )
      );

      expect(uploadTargets).toHaveLength(1);
      expect(uploadTargets[0]?.element.id).toBe("composer-plus-btn");
    } finally {
      fixture.cleanup();
    }
  });
});