import { describe, expect, test } from "bun:test";
import { getHintableElements } from "~/src/core/utils/hint-mode/collection/get-hintable-elements";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("getHintableElements Vimium parity", () => {
  test("skips tabindex-only elements that Vimium treats as second-class citizens", () => {
    const fixture = createDomFixture(`
      <div id="focusable" tabindex="0">Focusable wrapper</div>
      <button id="button" type="button">Action</button>
    `);

    try {
      const elements = getHintableElements("current-tab");
      expect(elements.map((element) => element.id)).toEqual(["button"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("skips aria-disabled interactive roles", () => {
    const fixture = createDomFixture(`
      <div id="disabled" role="button" aria-disabled="true">Disabled action</div>
      <div id="enabled" role="button">Enabled action</div>
    `);

    try {
      const elements = getHintableElements("current-tab");
      expect(elements.map((element) => element.id)).toEqual(["enabled"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("includes click jsaction elements like Vimium", () => {
    const fixture = createDomFixture(`
      <div id="hintable" jsaction="click:namespace.open">Open menu</div>
      <div id="ignored" jsaction="mousedown:namespace.open">Ignore me</div>
    `);

    try {
      const elements = getHintableElements("current-tab");
      expect(elements.map((element) => element.id)).toEqual(["hintable"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("dedupes false-positive descendants inside native buttons", () => {
    const fixture = createDomFixture(`
      <button id="github-button" class="rd-btn rd-btn-outline" type="button">
        <span class="rd-btn-icon">
          <i class="rd-icon-github"></i>
        </span>
      </button>
    `);

    try {
      const elements = getHintableElements("current-tab");
      expect(elements.map((element) => element.id)).toEqual(["github-button"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("dedupes role-based link descendants inside native links", () => {
    const fixture = createDomFixture(`
      <a id="endpoint" href="/playlist?list=LL">
        <tp-yt-paper-item id="guide-entry" role="link" tabindex="0" aria-disabled="false">
          <yt-formatted-string>Liked videos</yt-formatted-string>
        </tp-yt-paper-item>
      </a>
    `);

    try {
      const elements = getHintableElements("current-tab");
      expect(elements.map((element) => element.id)).toEqual(["endpoint"]);
    } finally {
      fixture.cleanup();
    }
  });
});