import { describe, expect, test } from "bun:test";
import {
  getHintableElements,
  revealHoverHintControls
} from "~/src/core/utils/hints/hint-recognition";
import { assignHintLabels } from "~/src/core/utils/hints/pipeline";
import { createEmptyReservedHintLabels } from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

describe("revealHoverHintControls", () => {
  test("keeps hidden response action groups hidden", () => {
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

      expect(group.style.pointerEvents).toBe("none");
      expect(group.style.opacity).toBe("0.4");
      expect(group.style.visibility).toBe("hidden");
      expect(revealedElements).toHaveLength(0);
      expect(getHintableElements("current-tab")).not.toContain(button);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps hidden trailing menu buttons hintable without revealing them", () => {
    const fixture = createDomFixture([
      "<a id='conversation-row' tabindex='0' class='row-link' draggable='true' aria-label='Placeholder conversation' href='/c/placeholder-conversation'><div class='row-main'><div class='truncate'><span dir='auto'>Placeholder conversation</span></div></div><div id='conversation-actions' class='trailing-actions' style='opacity:0; visibility:hidden; pointer-events:none; width:0; min-width:0; max-width:0; overflow:hidden;'><button id='conversation-more-button' tabindex='0' data-trailing-button='' aria-label='Open conversation options for Placeholder conversation' type='button' aria-haspopup='menu' aria-expanded='false' data-state='closed' style='opacity:0; visibility:hidden; pointer-events:none; width:0; min-width:0; max-width:0; overflow:hidden;'><span aria-hidden='true'>...</span></button></div></a>",
      "<a id='project-row' tabindex='0' class='row-link' href='/g/placeholder/workspace/project'><div class='row-main'><div class='row-icon'><button id='project-icon-button' type='button' aria-label='Open project icon picker'><span aria-hidden='true'>icon</span></button></div><div class='truncate'>Placeholder project</div></div><div id='project-actions' class='trailing-actions' style='opacity:0; visibility:hidden; pointer-events:none; width:0; min-width:0; max-width:0; overflow:hidden;'><button id='project-more-button' tabindex='0' data-trailing-button='' aria-label='Open project options for Placeholder project' type='button' aria-haspopup='menu' aria-expanded='false' data-state='closed' style='opacity:0; visibility:hidden; pointer-events:none; width:0; min-width:0; max-width:0; overflow:hidden;'><span aria-hidden='true'>...</span></button></div></a>"
    ]);

    try {
      const rects = new Map<string, DOMRect>([
        ["#conversation-row", new DOMRect(24, 24, 320, 40)],
        ["#conversation-more-button", new DOMRect(312, 28, 24, 24)],
        ["#conversation-actions", new DOMRect(304, 24, 36, 32)],
        ["#project-row", new DOMRect(24, 80, 320, 40)],
        ["#project-icon-button", new DOMRect(36, 84, 24, 24)],
        ["#project-more-button", new DOMRect(312, 84, 24, 24)],
        ["#project-actions", new DOMRect(304, 80, 36, 32)]
      ]);

      for (const [selector, rect] of rects.entries()) {
        const element = document.querySelector(selector);
        expect(element instanceof HTMLElement).toBe(true);
        if (!(element instanceof HTMLElement)) {
          continue;
        }

        element.getBoundingClientRect = (): DOMRect => rect;
        element.getClientRects = (): DOMRectList => createRectList(rect);
      }

      document.elementsFromPoint = (x: number, y: number): Element[] => {
        const orderedSelectors = [
          "#conversation-more-button",
          "#conversation-actions",
          "#conversation-row",
          "#project-more-button",
          "#project-actions",
          "#project-icon-button",
          "#project-row"
        ].filter((selector) => {
          const rect = rects.get(selector);
          return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        });

        return orderedSelectors
          .map((selector) => document.querySelector(selector))
          .filter((element): element is Element => element instanceof Element);
      };

      expect(getHintableElements("current-tab").map((element) => element.id)).toContain(
        "conversation-more-button"
      );
      expect(getHintableElements("current-tab").map((element) => element.id)).toContain(
        "project-more-button"
      );

      const revealedElements: Array<{ element: HTMLElement; inlineStyle: string | null }> = [];
      revealHoverHintControls("current-tab", revealedElements);

      const elements = getHintableElements("current-tab");
      expect(revealedElements).toHaveLength(0);
      expect(elements.map((element) => element.id)).toContain("conversation-more-button");
      expect(elements.map((element) => element.id)).toContain("project-more-button");

      const targets = assignHintLabels(elements, createEmptyReservedHintLabels(), {
        minHintLabelLength: 2,
        hintAlphabet: "asdfjkl",
        reservedHintPrefixes: new Set(),
        avoidedAdjacentHintPairs: {}
      });

      expect(
        targets.find((target) => target.element.id === "conversation-more-button")?.labelIcon
      ).toBe("more");
      expect(targets.find((target) => target.element.id === "project-more-button")?.labelIcon).toBe(
        "more"
      );
    } finally {
      fixture.cleanup();
    }
  });
});