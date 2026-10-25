import { describe, expect, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { updateVisibleTargets } from "~/src/core/utils/hint-mode/rendering/update-visible-targets";
import { LETTER_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("hint target filtering", () => {
  test("preserves target order, typed styling, and visibility when narrowing and backspacing", () => {
    const fixture = createDomFixture(
      "<button>One</button><button>Two</button><button>Three</button>"
    );

    try {
      const targets = buildHintTargets("current-tab", "abc", 2, false);
      const labels = ["aa", "ab", "ba"];
      targets.forEach((target, index) => {
        target.label = labels[index]!;
      });

      expect(updateVisibleTargets(targets, "a", true)).toEqual(targets.slice(0, 2));
      expect(targets.map((target) => target.marker.getAttribute("data-visible"))).toEqual([
        "true",
        "true",
        "false"
      ]);
      expect(targets[1]!.marker.textContent).toBe("AB");
      expect(
        Array.from(targets[1]!.marker.querySelectorAll(`[${LETTER_ATTRIBUTE}]`)).map((letter) =>
          letter.getAttribute(LETTER_ATTRIBUTE)
        )
      ).toEqual(["typed", "pending"]);
      expect(updateVisibleTargets(targets, "ab", false)).toEqual([targets[1]!]);
      expect(updateVisibleTargets(targets, "z", false)).toEqual([]);
      expect(updateVisibleTargets(targets, "", false)).toEqual(targets);
      expect(targets.every((target) => target.marker.getAttribute("data-visible") === "true")).toBe(
        true
      );
    } finally {
      fixture.cleanup();
    }
  });
});