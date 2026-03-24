import { describe, expect, test } from "bun:test";
import { updateMarkerPositions } from "~/src/core/utils/hints/layout";
import type { HintMarker } from "~/src/core/utils/hints/types";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import type { HintLayoutTestCase } from "~/tests/types";

const createMarkerRect = (width: number, height: number): DOMRect =>
  new DOMRect(0, 0, width, height);

export const hintLayoutTestCases: HintLayoutTestCase[] = [
  {
    desc: "avoids thumbnail marker placements covered by a sticky navbar",
    test: () => {
      const fixture = createDomFixture([
        "<div id='navbar'></div>",
        "<div id='video-card'><img id='video-thumb' alt='thumbnail' /></div>"
      ]);

      try {
        const navbar = document.querySelector("#navbar");
        const target = document.querySelector("#video-card");
        const thumbnail = document.querySelector("#video-thumb");
        expect(navbar instanceof HTMLElement).toBe(true);
        expect(target instanceof HTMLElement).toBe(true);
        expect(thumbnail instanceof HTMLElement).toBe(true);

        if (
          !(navbar instanceof HTMLElement) ||
          !(target instanceof HTMLElement) ||
          !(thumbnail instanceof HTMLElement)
        ) {
          return;
        }

        const navbarRect = new DOMRect(0, 0, 400, 95);
        const targetRect = new DOMRect(20, 20, 200, 120);
        const thumbnailRect = new DOMRect(20, 20, 200, 120);
        navbar.style.position = "sticky";
        navbar.getBoundingClientRect = (): DOMRect => navbarRect;
        target.getBoundingClientRect = (): DOMRect => targetRect;
        thumbnail.getBoundingClientRect = (): DOMRect => thumbnailRect;
        thumbnail.getClientRects = (): DOMRectList => {
          const list = [thumbnailRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        target.getClientRects = (): DOMRectList => {
          const list = [targetRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        document.elementsFromPoint = (x: number, y: number): Element[] => {
          const withinNavbar =
            x >= navbarRect.left &&
            x <= navbarRect.right &&
            y >= navbarRect.top &&
            y <= navbarRect.bottom;
          const withinTarget =
            x >= targetRect.left &&
            x <= targetRect.right &&
            y >= targetRect.top &&
            y <= targetRect.bottom;

          if (withinNavbar && withinTarget) {
            return [navbar, target];
          }

          if (withinTarget) {
            return [target];
          }

          if (withinNavbar) {
            return [navbar];
          }

          return [];
        };

        const marker = document.createElement("span");
        const markerRect = createMarkerRect(80, 40);
        marker.getBoundingClientRect = (): DOMRect => markerRect;
        document.body.append(marker);

        const hint: HintMarker = {
          element: target,
          marker,
          thumbnailIcon: null,
          label: "ab",
          directive: null,
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", true, "data-nav-hint-marker-variant");

        expect(marker.getAttribute("data-nav-hint-marker-variant")).toBe("thumbnail");
        expect(marker.style.left).toBe("22px");
        expect(marker.style.top).toBe("98px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "hides markers for targets that scrolled fully offscreen",
    test: () => {
      const fixture = createDomFixture("<button id='target'>Open</button>");

      try {
        const target = document.querySelector("#target");
        expect(target instanceof HTMLElement).toBe(true);

        if (!(target instanceof HTMLElement)) {
          return;
        }

        const offscreenRect = new DOMRect(-120, 24, 80, 32);
        target.getBoundingClientRect = (): DOMRect => offscreenRect;
        target.getClientRects = (): DOMRectList => {
          const list = [offscreenRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const marker = document.createElement("span");
        const markerRect = createMarkerRect(40, 20);
        marker.getBoundingClientRect = (): DOMRect => markerRect;
        document.body.append(marker);

        const hint: HintMarker = {
          element: target,
          marker,
          thumbnailIcon: null,
          label: "ab",
          directive: null,
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", false, "data-nav-hint-marker-variant");

        expect(marker.style.display).toBe("none");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "keeps default markers for thumbnail-like containers without actual media",
    test: () => {
      const fixture = createDomFixture(
        "<button id='target' class='thumbnail'>Notifications</button>"
      );

      try {
        const target = document.querySelector("#target");
        expect(target instanceof HTMLElement).toBe(true);

        if (!(target instanceof HTMLElement)) {
          return;
        }

        const targetRect = new DOMRect(20, 20, 220, 80);
        target.getBoundingClientRect = (): DOMRect => targetRect;
        target.getClientRects = (): DOMRectList => {
          const list = [targetRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const marker = document.createElement("span");
        const markerRect = createMarkerRect(80, 40);
        marker.getBoundingClientRect = (): DOMRect => markerRect;
        document.body.append(marker);

        const hint: HintMarker = {
          element: target,
          marker,
          thumbnailIcon: null,
          label: "ab",
          directive: null,
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", true, "data-nav-hint-marker-variant");

        expect(marker.getAttribute("data-nav-hint-marker-variant")).toBe("default");
        expect(marker.style.left).toBe("22px");
        expect(marker.style.top).toBe("22px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "avoids thumbnail marker placements covered by a fixed popup",
    test: () => {
      const fixture = createDomFixture([
        "<div id='popup'></div>",
        "<div id='video-card'><img id='video-thumb' alt='thumbnail' /></div>"
      ]);

      try {
        const popup = document.querySelector("#popup");
        const target = document.querySelector("#video-card");
        const thumbnail = document.querySelector("#video-thumb");
        expect(popup instanceof HTMLElement).toBe(true);
        expect(target instanceof HTMLElement).toBe(true);
        expect(thumbnail instanceof HTMLElement).toBe(true);

        if (
          !(popup instanceof HTMLElement) ||
          !(target instanceof HTMLElement) ||
          !(thumbnail instanceof HTMLElement)
        ) {
          return;
        }

        const popupRect = new DOMRect(60, 50, 160, 80);
        const targetRect = new DOMRect(20, 20, 240, 140);
        const thumbnailRect = new DOMRect(20, 20, 240, 140);
        popup.style.position = "fixed";
        popup.getBoundingClientRect = (): DOMRect => popupRect;
        target.getBoundingClientRect = (): DOMRect => targetRect;
        thumbnail.getBoundingClientRect = (): DOMRect => thumbnailRect;
        thumbnail.getClientRects = (): DOMRectList => {
          const list = [thumbnailRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        target.getClientRects = (): DOMRectList => {
          const list = [targetRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        document.elementsFromPoint = (x: number, y: number): Element[] => {
          const withinPopup =
            x >= popupRect.left &&
            x <= popupRect.right &&
            y >= popupRect.top &&
            y <= popupRect.bottom;
          const withinTarget =
            x >= targetRect.left &&
            x <= targetRect.right &&
            y >= targetRect.top &&
            y <= targetRect.bottom;

          if (withinPopup && withinTarget) {
            return [popup, thumbnail, target];
          }

          if (withinTarget) {
            return [thumbnail, target];
          }

          if (withinPopup) {
            return [popup];
          }

          return [];
        };

        const marker = document.createElement("span");
        const markerRect = createMarkerRect(80, 40);
        marker.getBoundingClientRect = (): DOMRect => markerRect;
        document.body.append(marker);

        const hint: HintMarker = {
          element: target,
          marker,
          thumbnailIcon: null,
          label: "ab",
          directive: null,
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", true, "data-nav-hint-marker-variant");

        expect(marker.getAttribute("data-nav-hint-marker-variant")).toBe("thumbnail");
        expect(marker.style.top).not.toBe("70px");
        expect(marker.style.top).toBe("8px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "places row menu hints on the right and row click hints near the middle",
    test: () => {
      const fixture = createDomFixture([
        "<a id='item-row' href='/item-a'>Item A</a>",
        "<button id='item-row-menu' type='button' aria-haspopup='menu' aria-expanded='false'>Actions</button>"
      ]);

      try {
        const row = document.querySelector("#item-row");
        const menu = document.querySelector("#item-row-menu");
        expect(row instanceof HTMLElement).toBe(true);
        expect(menu instanceof HTMLElement).toBe(true);

        if (!(row instanceof HTMLElement) || !(menu instanceof HTMLElement)) {
          return;
        }

        const rowRect = new DOMRect(20, 40, 260, 36);
        const menuRect = new DOMRect(20, 40, 260, 36);
        row.getBoundingClientRect = (): DOMRect => rowRect;
        row.getClientRects = (): DOMRectList => {
          const list = [rowRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        menu.getBoundingClientRect = (): DOMRect => menuRect;
        menu.getClientRects = (): DOMRectList => {
          const list = [menuRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const rowMarker = document.createElement("span");
        rowMarker.getBoundingClientRect = (): DOMRect => createMarkerRect(48, 20);
        document.body.append(rowMarker);

        const menuMarker = document.createElement("span");
        menuMarker.getBoundingClientRect = (): DOMRect => createMarkerRect(42, 20);
        document.body.append(menuMarker);

        const rowHint: HintMarker = {
          element: row,
          marker: rowMarker,
          thumbnailIcon: null,
          label: "ab",
          directive: null,
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        const menuHint: HintMarker = {
          element: menu,
          marker: menuMarker,
          thumbnailIcon: null,
          label: "cd",
          directive: null,
          labelIcon: "more",
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions(
          [rowHint, menuHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(menuMarker.style.left).toBe("236px");
        expect(menuMarker.style.top).toBe("48px");
        expect(rowMarker.style.left).toBe("126px");
        expect(rowMarker.style.top).toBe("48px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "anchors leading expand hints within the row instead of spilling outside",
    test: () => {
      const fixture = createDomFixture([
        "<a id='item-row' href='/item-b'><button id='item-row-toggle' type='button' data-state='closed'><svg aria-label='Item Icon'></svg></button><span>Item B</span><button id='item-row-menu' type='button' aria-haspopup='menu' aria-expanded='false'>Actions</button></a>"
      ]);

      try {
        const row = document.querySelector("#item-row");
        const toggle = document.querySelector("#item-row-toggle");
        const menu = document.querySelector("#item-row-menu");
        expect(row instanceof HTMLElement).toBe(true);
        expect(toggle instanceof HTMLElement).toBe(true);
        expect(menu instanceof HTMLElement).toBe(true);

        if (
          !(row instanceof HTMLElement) ||
          !(toggle instanceof HTMLElement) ||
          !(menu instanceof HTMLElement)
        ) {
          return;
        }

        const rowRect = new DOMRect(20, 40, 260, 36);
        const toggleRect = new DOMRect(28, 46, 24, 24);
        const menuRect = new DOMRect(244, 46, 24, 24);
        row.getBoundingClientRect = (): DOMRect => rowRect;
        row.getClientRects = (): DOMRectList => {
          const list = [rowRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        toggle.getBoundingClientRect = (): DOMRect => toggleRect;
        toggle.getClientRects = (): DOMRectList => {
          const list = [toggleRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        menu.getBoundingClientRect = (): DOMRect => menuRect;
        menu.getClientRects = (): DOMRectList => {
          const list = [menuRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const toggleMarker = document.createElement("span");
        toggleMarker.getBoundingClientRect = (): DOMRect => createMarkerRect(42, 20);
        document.body.append(toggleMarker);

        const rowMarker = document.createElement("span");
        rowMarker.getBoundingClientRect = (): DOMRect => createMarkerRect(48, 20);
        document.body.append(rowMarker);

        const menuMarker = document.createElement("span");
        menuMarker.getBoundingClientRect = (): DOMRect => createMarkerRect(42, 20);
        document.body.append(menuMarker);

        const toggleHint: HintMarker = {
          element: toggle,
          marker: toggleMarker,
          thumbnailIcon: null,
          label: "lf",
          directive: null,
          labelIcon: "expand",
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        const rowHint: HintMarker = {
          element: row,
          marker: rowMarker,
          thumbnailIcon: null,
          label: "ek",
          directive: null,
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        const menuHint: HintMarker = {
          element: menu,
          marker: menuMarker,
          thumbnailIcon: null,
          label: "ej",
          directive: null,
          labelIcon: "more",
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions(
          [toggleHint, rowHint, menuHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(toggleMarker.style.left).toBe("22px");
        expect(rowMarker.style.left).toBe("126px");
        expect(menuMarker.style.left).toBe("236px");
        expect(toggleMarker.style.top).toBe("48px");
        expect(rowMarker.style.top).toBe("48px");
        expect(menuMarker.style.top).toBe("48px");
        expect(Number.parseInt(toggleMarker.style.left, 10)).toBeLessThan(
          Number.parseInt(rowMarker.style.left, 10)
        );
        expect(Number.parseInt(rowMarker.style.left, 10)).toBeLessThan(
          Number.parseInt(menuMarker.style.left, 10)
        );
      } finally {
        fixture.cleanup();
      }
    }
  }
];

describe("hint marker layout", () => {
  for (const hintLayoutTestCase of hintLayoutTestCases) {
    test(hintLayoutTestCase.desc, hintLayoutTestCase.test);
  }
});