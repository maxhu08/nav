import { describe, expect, test } from "bun:test";
import { HINT_SAVE_ICON_PATH } from "~/src/lib/inline-icons";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  directiveLabels,
  expectDirectiveIconMarker
} from "~/tests/hint-mode/directive-recognition/shared";

describe("save directive recognition", () => {
  test("recognizes save and bookmark actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="save-button" type="button" aria-label="Save article"></button>
        <button id="follow-button" type="button" aria-label="Follow author"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const saveTarget = targets.find((target) => target.element.id === "save-button");
      const followTarget = targets.find((target) => target.element.id === "follow-button");

      expectDirectiveIconMarker(saveTarget, HINT_SAVE_ICON_PATH);
      expect(saveTarget?.label).toBe("sv");
      expect(followTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("recognizes favorite buttons as save actions", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="favorite-button" type="button" aria-label="Favorite"></button>
        <button id="follow-button" type="button" aria-label="Follow author"></button>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const favoriteTarget = targets.find((target) => target.element.id === "favorite-button");
      const followTarget = targets.find((target) => target.element.id === "follow-button");

      expectDirectiveIconMarker(favoriteTarget, HINT_SAVE_ICON_PATH);
      expect(favoriteTarget?.label).toBe("sv");
      expect(followTarget?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });

  test("does not treat generic favorite text as a save action", () => {
    const fixture = createDomFixture(`
      <main>
        <button id="save-button" type="button" aria-label="Save article"></button>
        <a id="video-title" href="https://www.youtube.com/watch?v=123">
          alpha favorite cactus window
        </a>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const saveTarget = targets.find((target) => target.element.id === "save-button");
      const videoTitleTarget = targets.find((target) => target.element.id === "video-title");

      expectDirectiveIconMarker(saveTarget, HINT_SAVE_ICON_PATH);
      expect(saveTarget?.label).toBe("sv");
      expect(videoTitleTarget?.label).not.toBe("sv");
    } finally {
      fixture.cleanup();
    }
  });
});