import { describe, expect, test } from "bun:test";
import { revealHoverHintControls } from "~/src/core/utils/hints/hint-recognition";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("revealHoverHintControls", () => {
  test("reveals response action groups so copy controls become hintable", () => {
    const fixture = createDomFixture(
      "<div aria-label='Response actions' role='group' style='pointer-events:none; opacity:0.4; visibility:hidden;'><button aria-label='Copy response' data-testid='copy-turn-action-button'>Copy</button><button aria-label='Share'>Share</button></div>"
    );

    try {
      const group = document.querySelector("[aria-label='Response actions']");
      const button = document.querySelector("[data-testid='copy-turn-action-button']");
      expect(group instanceof HTMLElement).toBe(true);
      expect(button instanceof HTMLElement).toBe(true);

      if (!(group instanceof HTMLElement) || !(button instanceof HTMLElement)) {
        return;
      }

      const revealedElements: Array<{ element: HTMLElement; inlineStyle: string | null }> = [];
      revealHoverHintControls("current-tab", revealedElements);

      expect(group.style.pointerEvents).toBe("auto");
      expect(group.style.opacity).toBe("1");
      expect(group.style.visibility).toBe("visible");
      expect(revealedElements.some((entry) => entry.element === group)).toBe(true);
      expect(revealedElements.some((entry) => entry.element === button)).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });
});