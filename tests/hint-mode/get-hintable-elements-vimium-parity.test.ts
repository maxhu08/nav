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
});