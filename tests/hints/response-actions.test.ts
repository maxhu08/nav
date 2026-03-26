import { describe, expect, test } from "bun:test";
import {
  getHintableElements,
  getPreferredDirectiveIndexes
} from "~/src/core/utils/hints/hint-recognition";
import { assignHintLabels } from "~/src/core/utils/hints/pipeline";
import { createEmptyReservedHintLabels } from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

describe("response action hints", () => {
  test("assigns copy and share to the corresponding response action buttons", () => {
    const fixture = createDomFixture(
      "<button id='generic-copy' aria-label='Copy' title='copy'>Copy</button><div id='response-actions' aria-label='Response actions' class='response-actions action-strip pointer-events-none reveal-on-hover' role='group' tabindex='-1'><button id='copy-response' class='icon-button' aria-label='Copy response' data-testid='copy-turn-action-button' data-state='closed'><span><svg aria-hidden='true'><use href='/assets/sprites.svg#copy-icon'></use></svg></span></button><button id='good-response' class='icon-button' aria-label='Good response' aria-pressed='false' data-testid='good-response-turn-action-button' data-state='closed'><span><svg aria-hidden='true'><use href='/assets/sprites.svg#good-icon'></use></svg></span></button><button id='bad-response' class='icon-button' aria-label='Bad response' aria-pressed='false' data-testid='bad-response-turn-action-button' data-state='closed'><span><svg aria-hidden='true'><use href='/assets/sprites.svg#bad-icon'></use></svg></span></button><button id='share-response' class='icon-button' aria-label='Share' data-state='closed'><span><svg aria-hidden='true'><use href='/assets/sprites.svg#share-icon'></use></svg></span></button><span data-state='closed'><button id='model-switch-button' type='button' aria-haspopup='menu' aria-expanded='false' data-state='closed' class='icon-button compact' aria-label='Switch model'><div><svg aria-hidden='true'><use href='/assets/sprites.svg#model-icon'></use></svg></div></button></span><button id='more-response-actions' class='icon-button compact' aria-label='More actions' type='button' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg aria-hidden='true'><use href='/assets/sprites.svg#more-icon'></use></svg></button></div>"
    );

    try {
      const rects = new Map<string, DOMRect>([
        ["#response-actions", new DOMRect(96, 120, 280, 40)],
        ["#generic-copy", new DOMRect(24, 72, 72, 32)],
        ["#copy-response", new DOMRect(96, 120, 32, 32)],
        ["#good-response", new DOMRect(144, 120, 32, 32)],
        ["#bad-response", new DOMRect(192, 120, 32, 32)],
        ["#share-response", new DOMRect(240, 120, 32, 32)],
        ["#model-switch-button", new DOMRect(288, 120, 32, 32)],
        ["#more-response-actions", new DOMRect(336, 120, 32, 32)]
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
        const hitSelectors = [
          "#copy-response",
          "#good-response",
          "#bad-response",
          "#share-response",
          "#model-switch-button",
          "#more-response-actions",
          "#response-actions"
        ].filter((selector) => {
          const rect = rects.get(selector);
          return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        });

        return hitSelectors
          .map((selector) => document.querySelector(selector))
          .filter((element): element is Element => element instanceof Element);
      };

      const elements = getHintableElements("current-tab");
      expect(elements.map((element) => element.id)).toEqual([
        "generic-copy",
        "copy-response",
        "good-response",
        "bad-response",
        "share-response",
        "model-switch-button",
        "more-response-actions"
      ]);

      const directives = getPreferredDirectiveIndexes(elements);
      expect(elements[directives.copy as number]?.id).toBe("copy-response");
      expect(elements[directives.share as number]?.id).toBe("share-response");

      const reservedLabels = createEmptyReservedHintLabels();
      reservedLabels.copy = ["cp"];
      reservedLabels.share = ["sh"];

      const targets = assignHintLabels(elements, reservedLabels, {
        minHintLabelLength: 2,
        hintAlphabet: "asdfjkl",
        reservedHintPrefixes: new Set(),
        avoidedAdjacentHintPairs: {}
      });

      expect(targets[0].element.id).toBe("generic-copy");
      expect(targets[0].directive).toBeNull();
      expect(targets[1].element.id).toBe("copy-response");
      expect(targets[1].directive).toBe("copy");
      expect(targets[4].element.id).toBe("share-response");
      expect(targets[4].directive).toBe("share");
      expect(targets[6].element.id).toBe("more-response-actions");
      expect(targets[6].labelIcon).toBe("more");
    } finally {
      fixture.cleanup();
    }
  });
});