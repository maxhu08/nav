import { describe, expect, test } from "bun:test";
import { HINT_HIDE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("hide directive recognition", () => {
  test("adds a synthetic hide target to the top-right of the popup regression case", () => {
    const fixture = createDomFixture(`
      <div class="rd-popup-wrapper">
        <div id="download-popup" class="rd-popup download-list">
          <div class="rd-popup-body">
            <div class="rd-popup-content scrollbar">
              <h2 class="rd-popup-title">Download</h2>
              <div class="item-list">
                <ul>
                  <li class="download-type">
                    <a id="download-icon-pack" href="https://github.com/example/icon-pack.zip" download title="download"></a>
                  </li>
                  <li class="download-type">
                    <a id="copy-install-command" title="copy"></a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    const wrapper = fixture.document.querySelector(".rd-popup-wrapper") as HTMLElement;
    const modal = fixture.document.getElementById("download-popup") as HTMLElement;
    const modalBody = fixture.document.querySelector(".rd-popup-body") as HTMLElement;
    const modalContent = fixture.document.querySelector(".rd-popup-content") as HTMLElement;
    const downloadButton = fixture.document.getElementById("download-icon-pack") as HTMLElement;

    wrapper.getBoundingClientRect = (): DOMRect => new DOMRect(0, 0, 800, 600);
    modal.getBoundingClientRect = (): DOMRect => new DOMRect(100, 100, 400, 300);
    modalBody.getBoundingClientRect = (): DOMRect => new DOMRect(120, 120, 360, 260);
    modalContent.getBoundingClientRect = (): DOMRect => new DOMRect(140, 140, 320, 220);
    downloadButton.getBoundingClientRect = (): DOMRect => new DOMRect(420, 220, 32, 32);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const hideTarget = targets.find((target) => target.directiveMatch?.directive === "hide");
      const downloadTarget = targets.find((target) => target.element.id === "download-icon-pack");

      expectDirectiveIconMarker(hideTarget, HINT_HIDE_ICON_PATH);
      expect(hideTarget?.label).toBe("hi");
      expect(hideTarget?.element).toBe(modal);
      expect(hideTarget?.element).not.toBe(modalBody);
      expect(hideTarget?.element).not.toBe(modalContent);
      expect(hideTarget?.rect.left).toBe(492);
      expect(hideTarget?.rect.top).toBe(108);
      expect(downloadTarget?.directiveMatch?.directive).toBe("download");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat generic page close buttons as hide", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="close-tab-button" type="button" aria-label="Close tab"></button>
        <button id="open-help-button" type="button" aria-label="Open help"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const hideTarget = targets.find(
        (target) =>
          target.element.id === "close-tab-button" && target.directiveMatch?.directive === "hide"
      );

      expect(hideTarget).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });

  test("does not synthesize hide for left-positioned navigation dialogs", () => {
    const fixture = createDomFixture(`
      <div
        role="dialog"
        id="global-nav-dialog"
        aria-labelledby="global-nav-title"
        aria-modal="true"
        data-position-regular="left"
        class="nav-dialog"
      >
        <h2 id="global-nav-title">Global Navigation Menu</h2>
        <button id="close-nav-button" type="button" aria-labelledby="close-nav-label">
          <svg aria-hidden="true" class="octicon octicon-x">
            <path d="M3 3L13 13M13 3L3 13"></path>
          </svg>
        </button>
        <span id="close-nav-label">Close menu</span>
        <nav>
          <a data-testid="side-nav-menu-item-HOME" href="/dashboard">Home</a>
        </nav>
      </div>
    `);

    const dialog = fixture.document.getElementById("global-nav-dialog") as HTMLElement;
    dialog.getBoundingClientRect = (): DOMRect => new DOMRect(0, 0, 320, 700);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const hideTarget = targets.find((target) => target.directiveMatch?.directive === "hide");

      expect(hideTarget).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });
});