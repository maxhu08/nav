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

  test("skips links clipped by a scroll container viewport", () => {
    const fixture = createDomFixture(`
      <section id="carousel-shell">
        <button id="prev-control" type="button" aria-label="Previous items">Previous</button>
        <div id="scroll-outer-container">
          <div id="scroll-container" style="overflow-x: auto; overflow-y: hidden;">
            <div id="items" style="transform: translateX(-60px);">
              <article class="card"><a id="card-1" href="/item-1">Placeholder item one</a></article>
              <article class="card"><a id="card-2" href="/item-2">Placeholder item two</a></article>
              <article class="card"><a id="card-3" href="/item-3">Placeholder item three</a></article>
            </div>
          </div>
        </div>
        <button id="next-control" type="button" aria-label="Next items">Next</button>
      </section>
    `);

    try {
      const scrollContainer = document.querySelector("#scroll-container");
      const cardCandidates = ["#card-1", "#card-2", "#card-3"].map((selector) =>
        document.querySelector(selector)
      );

      expect(scrollContainer instanceof HTMLElement).toBe(true);
      expect(cardCandidates.every((card) => card instanceof HTMLElement)).toBe(true);

      if (
        !(scrollContainer instanceof HTMLElement) ||
        cardCandidates.some((card) => !(card instanceof HTMLElement))
      ) {
        return;
      }

      const cards = cardCandidates as HTMLElement[];

      const containerRect = new DOMRect(100, 40, 320, 180);
      const cardRects = [
        new DOMRect(40, 70, 120, 100),
        new DOMRect(180, 70, 120, 100),
        new DOMRect(360, 70, 120, 100)
      ];

      scrollContainer.getBoundingClientRect = (): DOMRect => containerRect;
      scrollContainer.getClientRects = (): DOMRectList => createRectList(containerRect);

      cards.forEach((card, index) => {
        const rect = cardRects[index]!;
        card.getBoundingClientRect = (): DOMRect => rect;
        card.getClientRects = (): DOMRectList => createRectList(rect);
      });

      document.elementsFromPoint = (x: number, y: number): Element[] => {
        const hitCards = cards.filter((card) => {
          const rect = card.getBoundingClientRect();
          return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        });

        return hitCards.length > 0 ? [hitCards[hitCards.length - 1] as Element] : [];
      };

      const hintableCardIds = getHintableElements("current-tab")
        .map((element) => element.id)
        .filter((id) => id.startsWith("card-"));

      expect(hintableCardIds).toEqual(["card-2"]);
    } finally {
      fixture.cleanup();
    }
  });
});