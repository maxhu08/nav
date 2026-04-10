import { describe, expect, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("hint custom selectors", () => {
  test("includes visible non-hintable elements matched by auto selectors", () => {
    const fixture = createDomFixture(
      '<div id="custom-target" data-custom="true">Open project</div>'
    );

    try {
      history.replaceState(null, "", "https://example.com/workspace");

      const targets = buildHintTargets("current-tab", "abcd", 2, false, undefined, [], {}, false, [
        {
          pattern: "^https://example\\.com/",
          entries: [{ key: null, selector: "[data-custom='true']" }]
        }
      ]);

      expect(targets).toHaveLength(1);
      expect(targets[0]?.element.id).toBe("custom-target");
      expect(targets[0]?.label.length).toBeGreaterThan(0);
    } finally {
      fixture.cleanup();
    }
  });

  test("applies explicit custom labels to the first visible matched element", () => {
    const fixture = createDomFixture(
      '<button id="primary" data-custom-button="true">Compose</button><button id="secondary">Other</button>'
    );

    try {
      history.replaceState(null, "", "https://example.com/inbox");

      const targets = buildHintTargets("current-tab", "abcd", 2, false, undefined, [], {}, false, [
        {
          pattern: "^https://example\\.com/",
          entries: [{ key: "nav", selector: "[data-custom-button='true']" }]
        }
      ]);

      const customTarget = targets.find((target) => target.element.id === "primary");
      expect(customTarget?.label).toBe("nav");
    } finally {
      fixture.cleanup();
    }
  });
});