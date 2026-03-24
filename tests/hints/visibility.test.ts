import { describe, expect, test } from "bun:test";
import { getHintableElements } from "~/src/core/utils/hints/hint-recognition";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

describe("visibility hint scenarios", () => {
  test("drops intrinsic controls from hinting when another element fully covers them", () => {
    const fixture = createDomFixture([
      "<button id='covered-action' type='button' aria-label='Covered action'>Covered action</button>",
      "<div id='sticky-navbar-cover' aria-hidden='true'></div>"
    ]);

    try {
      const button = document.querySelector("#covered-action");
      const cover = document.querySelector("#sticky-navbar-cover");
      expect(button instanceof HTMLElement).toBe(true);
      expect(cover instanceof HTMLElement).toBe(true);

      if (!(button instanceof HTMLElement) || !(cover instanceof HTMLElement)) {
        return;
      }

      const rect = new DOMRect(24, 24, 120, 40);
      button.getBoundingClientRect = (): DOMRect => rect;
      button.getClientRects = (): DOMRectList => createRectList(rect);
      cover.getBoundingClientRect = (): DOMRect => rect;
      document.elementsFromPoint = (): Element[] => [cover, button];

      expect(getHintableElements("current-tab")).toEqual([]);
    } finally {
      fixture.cleanup();
    }
  });

  test("drops intrinsic controls when a dialog covers any sampled point", () => {
    const fixture = createDomFixture([
      "<button id='covered-action' type='button'>Covered action</button>",
      "<div id='popup' role='dialog' aria-modal='true'></div>"
    ]);

    try {
      const button = document.querySelector("#covered-action");
      const popup = document.querySelector("#popup");
      expect(button instanceof HTMLElement).toBe(true);
      expect(popup instanceof HTMLElement).toBe(true);

      if (!(button instanceof HTMLElement) || !(popup instanceof HTMLElement)) {
        return;
      }

      const buttonRect = new DOMRect(24, 24, 120, 40);
      const popupRect = new DOMRect(80, 24, 80, 40);
      button.getBoundingClientRect = (): DOMRect => buttonRect;
      button.getClientRects = (): DOMRectList => createRectList(buttonRect);
      popup.getBoundingClientRect = (): DOMRect => popupRect;

      document.elementsFromPoint = (x: number, y: number): Element[] => {
        const withinButton =
          x >= buttonRect.left &&
          x <= buttonRect.right &&
          y >= buttonRect.top &&
          y <= buttonRect.bottom;
        const withinPopup =
          x >= popupRect.left &&
          x <= popupRect.right &&
          y >= popupRect.top &&
          y <= popupRect.bottom;

        if (withinPopup && withinButton) {
          return [popup, button];
        }

        if (withinButton) {
          return [button];
        }

        if (withinPopup) {
          return [popup];
        }

        return [];
      };

      expect(getHintableElements("current-tab")).toEqual([]);
    } finally {
      fixture.cleanup();
    }
  });
});