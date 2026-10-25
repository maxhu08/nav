import { describe, expect, spyOn, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";

describe("directive descriptor reuse", () => {
  test("reads the shared descriptor once per element and refreshes it on the next build", () => {
    const fixture = createDomFixture('<button aria-label="Copy link">Action</button>');
    const button = document.querySelector("button")!;
    const attributes = spyOn(button, "getAttribute");

    try {
      const first = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      expect(first.some((target) => target.directiveMatch?.directive === "copy")).toBe(true);
      expect(attributes.mock.calls.filter((call) => call[0] === "name")).toHaveLength(1);

      button.setAttribute("aria-label", "Delete item");
      attributes.mockClear();
      const second = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      expect(second.some((target) => target.directiveMatch?.directive === "delete")).toBe(true);
      expect(second.some((target) => target.directiveMatch?.directive === "copy")).toBe(false);
      expect(attributes.mock.calls.filter((call) => call[0] === "name")).toHaveLength(1);
    } finally {
      attributes.mockRestore();
      fixture.cleanup();
    }
  });
});