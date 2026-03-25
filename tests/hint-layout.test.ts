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
    desc: "keeps directive menu item hints centered like other menu rows",
    test: () => {
      const fixture = createDomFixture(
        "<div role='menuitem' id='delete-item' tabindex='0' aria-label='Delete chat'>Delete</div>"
      );

      try {
        const deleteItem = document.querySelector("#delete-item");
        expect(deleteItem instanceof HTMLElement).toBe(true);

        if (!(deleteItem instanceof HTMLElement)) {
          return;
        }

        const itemRect = new DOMRect(20, 40, 260, 36);
        deleteItem.getBoundingClientRect = (): DOMRect => itemRect;
        deleteItem.getClientRects = (): DOMRectList => {
          const list = [itemRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const marker = document.createElement("span");
        marker.getBoundingClientRect = (): DOMRect => createMarkerRect(58, 20);
        document.body.append(marker);

        const hint: HintMarker = {
          element: deleteItem,
          marker,
          thumbnailIcon: null,
          label: "dd",
          directive: "delete",
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", false, "data-nav-hint-marker-variant");

        expect(marker.style.left).toBe("121px");
        expect(marker.style.top).toBe("48px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "keeps directive guide row hints centered like other modular rows",
    test: () => {
      const fixture = createDomFixture(
        "<nav aria-label='Guide'><a id='home-row' class='style-scope ytd-guide-entry-renderer' href='/'>Home</a></nav>"
      );

      try {
        const homeRow = document.querySelector("#home-row");
        expect(homeRow instanceof HTMLElement).toBe(true);

        if (!(homeRow instanceof HTMLElement)) {
          return;
        }

        const rowRect = new DOMRect(20, 40, 260, 36);
        homeRow.getBoundingClientRect = (): DOMRect => rowRect;
        homeRow.getClientRects = (): DOMRectList => {
          const list = [rowRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const marker = document.createElement("span");
        marker.getBoundingClientRect = (): DOMRect => createMarkerRect(58, 20);
        document.body.append(marker);

        const hint: HintMarker = {
          element: homeRow,
          marker,
          thumbnailIcon: null,
          label: "hh",
          directive: "home",
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", false, "data-nav-hint-marker-variant");

        expect(marker.style.left).toBe("121px");
        expect(marker.style.top).toBe("48px");
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
  },
  {
    desc: "places hide directive markers at the popup top-right inside the backdrop",
    test: () => {
      const fixture = createDomFixture(
        "<div id='popup-wrapper' class='rd-popup-wrapper'><div id='popup-surface' class='rd-popup download-list'><div class='rd-popup-body'><div class='rd-popup-content'><h2>Download</h2></div></div></div></div>"
      );

      try {
        const wrapper = document.querySelector("#popup-wrapper");
        const popup = document.querySelector("#popup-surface");
        expect(wrapper instanceof HTMLElement).toBe(true);
        expect(popup instanceof HTMLElement).toBe(true);

        if (!(wrapper instanceof HTMLElement) || !(popup instanceof HTMLElement)) {
          return;
        }

        const wrapperRect = new DOMRect(0, 0, 360, 260);
        const popupRect = new DOMRect(56, 36, 248, 188);
        wrapper.getBoundingClientRect = (): DOMRect => wrapperRect;
        wrapper.getClientRects = (): DOMRectList => {
          const list = [wrapperRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        popup.getBoundingClientRect = (): DOMRect => popupRect;
        popup.getClientRects = (): DOMRectList => {
          const list = [popupRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const marker = document.createElement("span");
        marker.getBoundingClientRect = (): DOMRect => createMarkerRect(48, 20);
        document.body.append(marker);

        const hint: HintMarker = {
          element: wrapper,
          marker,
          thumbnailIcon: null,
          label: "hi",
          directive: "hide",
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", false, "data-nav-hint-marker-variant");

        expect(marker.style.left).toBe("254px");
        expect(marker.style.top).toBe("38px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "keeps response action markers anchored to each button instead of the whole group",
    test: () => {
      const fixture = createDomFixture(
        "<div id='response-actions' aria-label='Response actions' role='group' tabindex='-1'><button id='copy-response' aria-label='Copy response'>Copy</button><button id='share-response' aria-label='Share'>Share</button></div>"
      );

      try {
        const copyButton = document.querySelector("#copy-response");
        const shareButton = document.querySelector("#share-response");
        const group = document.querySelector("#response-actions");
        expect(copyButton instanceof HTMLElement).toBe(true);
        expect(shareButton instanceof HTMLElement).toBe(true);
        expect(group instanceof HTMLElement).toBe(true);

        if (
          !(copyButton instanceof HTMLElement) ||
          !(shareButton instanceof HTMLElement) ||
          !(group instanceof HTMLElement)
        ) {
          return;
        }

        const groupRect = new DOMRect(96, 120, 280, 40);
        const copyRect = new DOMRect(96, 120, 32, 32);
        const shareRect = new DOMRect(240, 120, 32, 32);
        group.getBoundingClientRect = (): DOMRect => groupRect;
        group.getClientRects = (): DOMRectList => {
          const list = [groupRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        copyButton.getBoundingClientRect = (): DOMRect => copyRect;
        copyButton.getClientRects = (): DOMRectList => {
          const list = [copyRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };
        shareButton.getBoundingClientRect = (): DOMRect => shareRect;
        shareButton.getClientRects = (): DOMRectList => {
          const list = [shareRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const copyMarker = document.createElement("span");
        copyMarker.getBoundingClientRect = (): DOMRect => createMarkerRect(48, 20);
        document.body.append(copyMarker);

        const shareMarker = document.createElement("span");
        shareMarker.getBoundingClientRect = (): DOMRect => createMarkerRect(48, 20);
        document.body.append(shareMarker);

        const copyHint: HintMarker = {
          element: copyButton,
          marker: copyMarker,
          thumbnailIcon: null,
          label: "cp",
          directive: "copy",
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        const shareHint: HintMarker = {
          element: shareButton,
          marker: shareMarker,
          thumbnailIcon: null,
          label: "sh",
          directive: "share",
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions(
          [copyHint, shareHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(copyMarker.style.left).toBe("129px");
        expect(copyMarker.style.top).toBe("111px");
        expect(shareMarker.style.left).toBe("183px");
        expect(shareMarker.style.top).toBe("111px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "keeps trailing more hints at the far right for sidebar module rows",
    test: () => {
      const fixture = createDomFixture([
        "<a id='module-row' tabindex='0' data-sidebar-item='true' href='/g/example'><div class='flex min-w-0 items-center gap-1.5'><div class='icon'><img alt='' src='https://example.com/icon.png' /></div><div class='flex min-w-0 grow items-center gap-2.5'><div class='truncate'>Module Row</div></div></div><div class='trailing'><button id='module-row-menu' tabindex='0' data-trailing-button='true' class='module-row-trailing-btn' type='button' aria-haspopup='menu' aria-expanded='false' data-state='closed'><div><svg aria-hidden='true'></svg></div></button></div></a>"
      ]);

      try {
        const row = document.querySelector("#module-row");
        const menu = document.querySelector("#module-row-menu");
        expect(row instanceof HTMLElement).toBe(true);
        expect(menu instanceof HTMLElement).toBe(true);

        if (!(row instanceof HTMLElement) || !(menu instanceof HTMLElement)) {
          return;
        }

        const rowRect = new DOMRect(20, 40, 320, 40);
        const menuRect = new DOMRect(304, 48, 24, 24);
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

        expect(menuMarker.style.left).toBe("296px");
        expect(menuMarker.style.top).toBe("50px");
        expect(rowMarker.style.left).toBe("156px");
        expect(rowMarker.style.top).toBe("50px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "keeps input directives anchored to the leading edge of a wide search control",
    test: () => {
      const fixture = createDomFixture(
        "<button id='search-launcher' type='button' aria-label='Search or jump to'><span>Type / to search</span></button>"
      );

      try {
        const searchLauncher = document.querySelector("#search-launcher");
        expect(searchLauncher instanceof HTMLElement).toBe(true);

        if (!(searchLauncher instanceof HTMLElement)) {
          return;
        }

        const launcherRect = new DOMRect(120, 140, 420, 44);
        searchLauncher.getBoundingClientRect = (): DOMRect => launcherRect;
        searchLauncher.getClientRects = (): DOMRectList => {
          const list = [launcherRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        const marker = document.createElement("span");
        marker.getBoundingClientRect = (): DOMRect => createMarkerRect(58, 20);
        document.body.append(marker);

        const hint: HintMarker = {
          element: searchLauncher,
          marker,
          thumbnailIcon: null,
          label: "kj",
          directive: "input",
          labelIcon: null,
          letters: [],
          visible: true,
          renderedTyped: "",
          markerWidth: 0,
          markerHeight: 0,
          sizeDirty: true
        };

        updateMarkerPositions([hint], "current-tab", false, "data-nav-hint-marker-variant");

        expect(marker.style.left).toBe("122px");
        expect(marker.style.top).toBe("152px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "aligns navbar hints to a shared top edge while keeping input inside the field",
    test: () => {
      const fixture = createDomFixture([
        "<header id='topbar'><button id='nav-home' type='button' aria-label='Home'></button><button id='nav-search' type='button' aria-label='Search or jump to'></button><button id='nav-mic' type='button' aria-label='Microphone'></button><button id='nav-notification' type='button' aria-label='Notifications'></button></header>"
      ]);

      try {
        const home = document.querySelector("#nav-home");
        const search = document.querySelector("#nav-search");
        const mic = document.querySelector("#nav-mic");
        const notification = document.querySelector("#nav-notification");
        const topbar = document.querySelector("#topbar");
        expect(home instanceof HTMLElement).toBe(true);
        expect(search instanceof HTMLElement).toBe(true);
        expect(mic instanceof HTMLElement).toBe(true);
        expect(notification instanceof HTMLElement).toBe(true);
        expect(topbar instanceof HTMLElement).toBe(true);

        if (
          !(home instanceof HTMLElement) ||
          !(search instanceof HTMLElement) ||
          !(mic instanceof HTMLElement) ||
          !(notification instanceof HTMLElement) ||
          !(topbar instanceof HTMLElement)
        ) {
          return;
        }

        const topbarRect = new DOMRect(0, 0, 1024, 56);
        const homeRect = new DOMRect(20, 10, 44, 36);
        const searchRect = new DOMRect(260, 8, 420, 40);
        const micRect = new DOMRect(720, 12, 40, 32);
        const notificationRect = new DOMRect(860, 14, 40, 28);

        topbar.getBoundingClientRect = (): DOMRect => topbarRect;
        topbar.getClientRects = (): DOMRectList => {
          const list = [topbarRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        for (const [element, rect] of [
          [home, homeRect],
          [search, searchRect],
          [mic, micRect],
          [notification, notificationRect]
        ] as const) {
          element.getBoundingClientRect = (): DOMRect => rect;
          element.getClientRects = (): DOMRectList => {
            const list = [rect] as unknown as DOMRectList & DOMRect[];
            list.item = (index: number): DOMRect | null => list[index] ?? null;
            return list;
          };
        }

        const makeHint = (
          element: HTMLElement,
          label: string,
          width: number,
          directive: HintMarker["directive"]
        ): HintMarker => {
          const marker = document.createElement("span");
          marker.getBoundingClientRect = (): DOMRect => createMarkerRect(width, 20);
          document.body.append(marker);

          return {
            element,
            marker,
            thumbnailIcon: null,
            label,
            directive,
            labelIcon: null,
            letters: [],
            visible: true,
            renderedTyped: "",
            markerWidth: 0,
            markerHeight: 0,
            sizeDirty: true
          };
        };

        const homeHint = makeHint(home, "we", 48, "home");
        const searchHint = makeHint(search, "kj", 58, "input");
        const micHint = makeHint(mic, "mi", 50, "microphone");
        const notificationHint = makeHint(notification, "nf", 48, "notification");

        updateMarkerPositions(
          [homeHint, searchHint, micHint, notificationHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(homeHint.marker.style.left).toBe("22px");
        expect(micHint.marker.style.left).toBe("722px");
        expect(notificationHint.marker.style.left).toBe("862px");
        expect(homeHint.marker.style.top).toBe("12px");
        expect(micHint.marker.style.top).toBe("12px");
        expect(notificationHint.marker.style.top).toBe("12px");
        expect(searchHint.marker.style.left).toBe("262px");
        expect(searchHint.marker.style.top).toBe("18px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "aligns nested masthead navbar hints across start center and end sections",
    test: () => {
      const fixture = createDomFixture([
        "<div id='masthead-shell' class='app-shell generic-masthead'><div id='masthead-start' class='section generic-masthead'><button id='masthead-back' type='button' aria-label='Back'></button><button id='masthead-guide' type='button' aria-label='Guide'></button><a id='masthead-home' href='/' title='App Home'>Home</a></div><div id='masthead-center' class='section generic-masthead'><button id='masthead-search-launcher' type='button' aria-label='Search'></button><button id='masthead-mic' type='button' aria-label='Voice search'></button></div><div id='masthead-end' class='section generic-masthead'><button id='masthead-create' type='button' aria-label='Create'></button><button id='masthead-notifications' type='button' aria-label='Notifications'></button><button id='masthead-account' type='button' aria-label='Account menu'></button></div></div>"
      ]);

      try {
        const back = document.querySelector("#masthead-back");
        const guide = document.querySelector("#masthead-guide");
        const searchLauncher = document.querySelector("#masthead-search-launcher");
        const mic = document.querySelector("#masthead-mic");
        const create = document.querySelector("#masthead-create");
        const notifications = document.querySelector("#masthead-notifications");
        const account = document.querySelector("#masthead-account");
        const shell = document.querySelector("#masthead-shell");
        expect(back instanceof HTMLElement).toBe(true);
        expect(guide instanceof HTMLElement).toBe(true);
        expect(searchLauncher instanceof HTMLElement).toBe(true);
        expect(mic instanceof HTMLElement).toBe(true);
        expect(create instanceof HTMLElement).toBe(true);
        expect(notifications instanceof HTMLElement).toBe(true);
        expect(account instanceof HTMLElement).toBe(true);
        expect(shell instanceof HTMLElement).toBe(true);

        if (
          !(back instanceof HTMLElement) ||
          !(guide instanceof HTMLElement) ||
          !(searchLauncher instanceof HTMLElement) ||
          !(mic instanceof HTMLElement) ||
          !(create instanceof HTMLElement) ||
          !(notifications instanceof HTMLElement) ||
          !(account instanceof HTMLElement) ||
          !(shell instanceof HTMLElement)
        ) {
          return;
        }

        const shellRect = new DOMRect(0, 0, 980, 56);
        const backRect = new DOMRect(16, 12, 36, 32);
        const guideRect = new DOMRect(68, 12, 36, 32);
        const searchRect = new DOMRect(320, 8, 440, 40);
        const micRect = new DOMRect(720, 12, 36, 32);
        const createRect = new DOMRect(780, 12, 64, 32);
        const notificationsRect = new DOMRect(860, 12, 36, 32);
        const accountRect = new DOMRect(916, 12, 36, 32);

        shell.getBoundingClientRect = (): DOMRect => shellRect;
        shell.getClientRects = (): DOMRectList => {
          const list = [shellRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        for (const [element, rect] of [
          [back, backRect],
          [guide, guideRect],
          [searchLauncher, searchRect],
          [mic, micRect],
          [create, createRect],
          [notifications, notificationsRect],
          [account, accountRect]
        ] as const) {
          element.getBoundingClientRect = (): DOMRect => rect;
          element.getClientRects = (): DOMRectList => {
            const list = [rect] as unknown as DOMRectList & DOMRect[];
            list.item = (index: number): DOMRect | null => list[index] ?? null;
            return list;
          };
        }

        const makeHint = (
          element: HTMLElement,
          label: string,
          width: number,
          directive: HintMarker["directive"]
        ): HintMarker => {
          const marker = document.createElement("span");
          marker.getBoundingClientRect = (): DOMRect => createMarkerRect(width, 20);
          document.body.append(marker);

          return {
            element,
            marker,
            thumbnailIcon: null,
            label,
            directive,
            labelIcon: null,
            letters: [],
            visible: true,
            renderedTyped: "",
            markerWidth: 0,
            markerHeight: 0,
            sizeDirty: true
          };
        };

        const backHint = makeHint(back, "bk", 48, null);
        const guideHint = makeHint(guide, "sd", 54, "sidebar");
        const searchHint = makeHint(searchLauncher, "kj", 58, "input");
        const micHint = makeHint(mic, "mi", 50, "microphone");
        const createHint = makeHint(create, "sj", 48, null);
        const notificationsHint = makeHint(notifications, "nf", 48, "notification");
        const accountHint = makeHint(account, "sk", 42, null);

        updateMarkerPositions(
          [backHint, guideHint, searchHint, micHint, createHint, notificationsHint, accountHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(backHint.marker.style.left).toBe("18px");
        expect(guideHint.marker.style.left).toBe("70px");
        expect(micHint.marker.style.left).toBe("722px");
        expect(createHint.marker.style.left).toBe("782px");
        expect(notificationsHint.marker.style.left).toBe("862px");
        expect(accountHint.marker.style.left).toBe("918px");
        expect(backHint.marker.style.top).toBe("14px");
        expect(guideHint.marker.style.top).toBe("14px");
        expect(micHint.marker.style.top).toBe("14px");
        expect(createHint.marker.style.top).toBe("14px");
        expect(notificationsHint.marker.style.top).toBe("14px");
        expect(accountHint.marker.style.top).toBe("14px");
        expect(searchHint.marker.style.left).toBe("322px");
        expect(searchHint.marker.style.top).toBe("18px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "keeps stacked header rows aligned independently instead of collapsing to one level",
    test: () => {
      const fixture = createDomFixture([
        "<header id='stacked-header' role='banner' aria-label='Global navigation'><div id='header-top-row'><button id='top-menu' type='button' aria-label='Open menu'></button><a id='top-home' href='/' title='Homepage'>Home</a><button id='top-search' type='button' aria-label='Search or jump to'></button><button id='top-create' type='button' aria-label='Create new'></button><button id='top-alerts' type='button' aria-label='Notifications'></button></div><nav id='header-second-row' aria-label='Section navigation'><a id='tab-overview' href='/overview'>Overview</a><a id='tab-repos' href='/repos'>Repositories</a><a id='tab-projects' href='/projects'>Projects</a><a id='tab-packages' href='/packages'>Packages</a><a id='tab-stars' href='/stars'>Stars</a></nav></header>"
      ]);

      try {
        const topMenu = document.querySelector("#top-menu");
        const topHome = document.querySelector("#top-home");
        const topSearch = document.querySelector("#top-search");
        const topCreate = document.querySelector("#top-create");
        const topAlerts = document.querySelector("#top-alerts");
        const tabOverview = document.querySelector("#tab-overview");
        const tabRepos = document.querySelector("#tab-repos");
        const tabProjects = document.querySelector("#tab-projects");
        const tabPackages = document.querySelector("#tab-packages");
        const tabStars = document.querySelector("#tab-stars");
        const header = document.querySelector("#stacked-header");
        expect(topMenu instanceof HTMLElement).toBe(true);
        expect(topHome instanceof HTMLElement).toBe(true);
        expect(topSearch instanceof HTMLElement).toBe(true);
        expect(topCreate instanceof HTMLElement).toBe(true);
        expect(topAlerts instanceof HTMLElement).toBe(true);
        expect(tabOverview instanceof HTMLElement).toBe(true);
        expect(tabRepos instanceof HTMLElement).toBe(true);
        expect(tabProjects instanceof HTMLElement).toBe(true);
        expect(tabPackages instanceof HTMLElement).toBe(true);
        expect(tabStars instanceof HTMLElement).toBe(true);
        expect(header instanceof HTMLElement).toBe(true);

        if (
          !(topMenu instanceof HTMLElement) ||
          !(topHome instanceof HTMLElement) ||
          !(topSearch instanceof HTMLElement) ||
          !(topCreate instanceof HTMLElement) ||
          !(topAlerts instanceof HTMLElement) ||
          !(tabOverview instanceof HTMLElement) ||
          !(tabRepos instanceof HTMLElement) ||
          !(tabProjects instanceof HTMLElement) ||
          !(tabPackages instanceof HTMLElement) ||
          !(tabStars instanceof HTMLElement) ||
          !(header instanceof HTMLElement)
        ) {
          return;
        }

        const headerRect = new DOMRect(0, 0, 980, 96);
        const topMenuRect = new DOMRect(24, 10, 40, 32);
        const topHomeRect = new DOMRect(88, 10, 120, 32);
        const topSearchRect = new DOMRect(520, 10, 56, 32);
        const topCreateRect = new DOMRect(720, 10, 56, 32);
        const topAlertsRect = new DOMRect(900, 10, 40, 32);
        const tabOverviewRect = new DOMRect(48, 64, 120, 32);
        const tabReposRect = new DOMRect(260, 64, 160, 32);
        const tabProjectsRect = new DOMRect(500, 64, 120, 32);
        const tabPackagesRect = new DOMRect(680, 64, 140, 32);
        const tabStarsRect = new DOMRect(860, 64, 100, 32);

        header.getBoundingClientRect = (): DOMRect => headerRect;
        header.getClientRects = (): DOMRectList => {
          const list = [headerRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        for (const [element, rect] of [
          [topMenu, topMenuRect],
          [topHome, topHomeRect],
          [topSearch, topSearchRect],
          [topCreate, topCreateRect],
          [topAlerts, topAlertsRect],
          [tabOverview, tabOverviewRect],
          [tabRepos, tabReposRect],
          [tabProjects, tabProjectsRect],
          [tabPackages, tabPackagesRect],
          [tabStars, tabStarsRect]
        ] as const) {
          element.getBoundingClientRect = (): DOMRect => rect;
          element.getClientRects = (): DOMRectList => {
            const list = [rect] as unknown as DOMRectList & DOMRect[];
            list.item = (index: number): DOMRect | null => list[index] ?? null;
            return list;
          };
        }

        const makeHint = (
          element: HTMLElement,
          label: string,
          width: number,
          directive: HintMarker["directive"] = null
        ): HintMarker => {
          const marker = document.createElement("span");
          marker.getBoundingClientRect = (): DOMRect => createMarkerRect(width, 20);
          document.body.append(marker);

          return {
            element,
            marker,
            thumbnailIcon: null,
            label,
            directive,
            labelIcon: null,
            letters: [],
            visible: true,
            renderedTyped: "",
            markerWidth: 0,
            markerHeight: 0,
            sizeDirty: true
          };
        };

        const topMenuHint = makeHint(topMenu, "sf", 42);
        const topHomeHint = makeHint(topHome, "sd", 54, "home");
        const topSearchHint = makeHint(topSearch, "kj", 46, "input");
        const topCreateHint = makeHint(topCreate, "da", 42);
        const topAlertsHint = makeHint(topAlerts, "df", 42, "notification");
        const tabOverviewHint = makeHint(tabOverview, "aj", 42);
        const tabReposHint = makeHint(tabRepos, "sj", 42);
        const tabProjectsHint = makeHint(tabProjects, "ds", 42);
        const tabPackagesHint = makeHint(tabPackages, "dk", 42);
        const tabStarsHint = makeHint(tabStars, "dl", 42);

        updateMarkerPositions(
          [
            topMenuHint,
            topHomeHint,
            topSearchHint,
            topCreateHint,
            topAlertsHint,
            tabOverviewHint,
            tabReposHint,
            tabProjectsHint,
            tabPackagesHint,
            tabStarsHint
          ],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(topMenuHint.marker.style.top).toBe("12px");
        expect(topHomeHint.marker.style.top).toBe("12px");
        expect(topCreateHint.marker.style.top).toBe("12px");
        expect(topAlertsHint.marker.style.top).toBe("12px");
        expect(topSearchHint.marker.style.top).toBe("16px");
        expect(tabOverviewHint.marker.style.top).toBe("66px");
        expect(tabReposHint.marker.style.top).toBe("66px");
        expect(tabProjectsHint.marker.style.top).toBe("66px");
        expect(tabPackagesHint.marker.style.top).toBe("66px");
        expect(tabStarsHint.marker.style.top).toBe("66px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "aligns shorts player controls to the top left of each control",
    test: () => {
      const fixture = createDomFixture([
        "<div id='shorts-shell'><div id='shorts-controls' class='generic-shorts-player-controls'><div id='controls-left'><button id='shorts-play' type='button' aria-label='Play'></button></div><div id='controls-right'><button id='shorts-cc' type='button' aria-label='Captions off'></button><button id='shorts-more' type='button' aria-label='More actions' aria-haspopup='menu'></button><button id='shorts-fullscreen' type='button' aria-label='Fullscreen'></button></div></div></div>"
      ]);

      try {
        const play = document.querySelector("#shorts-play");
        const captions = document.querySelector("#shorts-cc");
        const more = document.querySelector("#shorts-more");
        const fullscreen = document.querySelector("#shorts-fullscreen");
        const controls = document.querySelector("#shorts-controls");
        expect(play instanceof HTMLElement).toBe(true);
        expect(captions instanceof HTMLElement).toBe(true);
        expect(more instanceof HTMLElement).toBe(true);
        expect(fullscreen instanceof HTMLElement).toBe(true);
        expect(controls instanceof HTMLElement).toBe(true);

        if (
          !(play instanceof HTMLElement) ||
          !(captions instanceof HTMLElement) ||
          !(more instanceof HTMLElement) ||
          !(fullscreen instanceof HTMLElement) ||
          !(controls instanceof HTMLElement)
        ) {
          return;
        }

        const controlsRect = new DOMRect(0, 0, 360, 72);
        const playRect = new DOMRect(24, 18, 44, 44);
        const captionsRect = new DOMRect(86, 18, 44, 44);
        const moreRect = new DOMRect(176, 18, 44, 44);
        const fullscreenRect = new DOMRect(272, 18, 44, 44);

        controls.getBoundingClientRect = (): DOMRect => controlsRect;
        controls.getClientRects = (): DOMRectList => {
          const list = [controlsRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        for (const [element, rect] of [
          [play, playRect],
          [captions, captionsRect],
          [more, moreRect],
          [fullscreen, fullscreenRect]
        ] as const) {
          element.getBoundingClientRect = (): DOMRect => rect;
          element.getClientRects = (): DOMRectList => {
            const list = [rect] as unknown as DOMRectList & DOMRect[];
            list.item = (index: number): DOMRect | null => list[index] ?? null;
            return list;
          };
        }

        const makeHint = (
          element: HTMLElement,
          label: string,
          width: number,
          directive: HintMarker["directive"] = null,
          labelIcon: HintMarker["labelIcon"] = null
        ): HintMarker => {
          const marker = document.createElement("span");
          marker.getBoundingClientRect = (): DOMRect => createMarkerRect(width, 20);
          document.body.append(marker);

          return {
            element,
            marker,
            thumbnailIcon: null,
            label,
            directive,
            labelIcon,
            letters: [],
            visible: true,
            renderedTyped: "",
            markerWidth: 0,
            markerHeight: 0,
            sizeDirty: true
          };
        };

        const playHint = makeHint(play, "af", 42);
        const captionsHint = makeHint(captions, "cc", 42);
        const moreHint = makeHint(more, "aj", 50, null, "more");
        const fullscreenHint = makeHint(fullscreen, "ds", 42);

        updateMarkerPositions(
          [playHint, captionsHint, moreHint, fullscreenHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(playHint.marker.style.left).toBe("26px");
        expect(captionsHint.marker.style.left).toBe("88px");
        expect(moreHint.marker.style.left).toBe("178px");
        expect(fullscreenHint.marker.style.left).toBe("274px");
        expect(playHint.marker.style.top).toBe("20px");
        expect(captionsHint.marker.style.top).toBe("20px");
        expect(moreHint.marker.style.top).toBe("20px");
        expect(fullscreenHint.marker.style.top).toBe("20px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "aligns reel action bar hints to the top left for each action including directives",
    test: () => {
      const fixture = createDomFixture([
        "<div id='button-bar'><div class='generic-reel-action-bar'><button id='reel-like' type='button' aria-label='Like'></button><button id='reel-dislike' type='button' aria-label='Dislike'></button><button id='reel-comments' type='button' aria-label='Comments'></button><button id='reel-share' type='button' aria-label='Share'></button><button id='reel-remix' type='button' aria-label='Remix'></button></div></div>"
      ]);

      try {
        const like = document.querySelector("#reel-like");
        const dislike = document.querySelector("#reel-dislike");
        const comments = document.querySelector("#reel-comments");
        const share = document.querySelector("#reel-share");
        const remix = document.querySelector("#reel-remix");
        const buttonBar = document.querySelector("#button-bar");
        expect(like instanceof HTMLElement).toBe(true);
        expect(dislike instanceof HTMLElement).toBe(true);
        expect(comments instanceof HTMLElement).toBe(true);
        expect(share instanceof HTMLElement).toBe(true);
        expect(remix instanceof HTMLElement).toBe(true);
        expect(buttonBar instanceof HTMLElement).toBe(true);

        if (
          !(like instanceof HTMLElement) ||
          !(dislike instanceof HTMLElement) ||
          !(comments instanceof HTMLElement) ||
          !(share instanceof HTMLElement) ||
          !(remix instanceof HTMLElement) ||
          !(buttonBar instanceof HTMLElement)
        ) {
          return;
        }

        const barRect = new DOMRect(0, 0, 140, 360);
        const likeRect = new DOMRect(80, 24, 44, 60);
        const dislikeRect = new DOMRect(80, 96, 44, 60);
        const commentsRect = new DOMRect(80, 168, 44, 60);
        const shareRect = new DOMRect(80, 240, 44, 60);
        const remixRect = new DOMRect(80, 312, 44, 60);

        buttonBar.getBoundingClientRect = (): DOMRect => barRect;
        buttonBar.getClientRects = (): DOMRectList => {
          const list = [barRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        for (const [element, rect] of [
          [like, likeRect],
          [dislike, dislikeRect],
          [comments, commentsRect],
          [share, shareRect],
          [remix, remixRect]
        ] as const) {
          element.getBoundingClientRect = (): DOMRect => rect;
          element.getClientRects = (): DOMRectList => {
            const list = [rect] as unknown as DOMRectList & DOMRect[];
            list.item = (index: number): DOMRect | null => list[index] ?? null;
            return list;
          };
        }

        const makeHint = (
          element: HTMLElement,
          label: string,
          width: number,
          directive: HintMarker["directive"] = null
        ): HintMarker => {
          const marker = document.createElement("span");
          marker.getBoundingClientRect = (): DOMRect => createMarkerRect(width, 20);
          document.body.append(marker);

          return {
            element,
            marker,
            thumbnailIcon: null,
            label,
            directive,
            labelIcon: null,
            letters: [],
            visible: true,
            renderedTyped: "",
            markerWidth: 0,
            markerHeight: 0,
            sizeDirty: true
          };
        };

        const likeHint = makeHint(like, "iu", 42, "like");
        const dislikeHint = makeHint(dislike, "id", 42, "dislike");
        const commentsHint = makeHint(comments, "aj", 42);
        const shareHint = makeHint(share, "sv", 42, "share");
        const remixHint = makeHint(remix, "rx", 42);

        updateMarkerPositions(
          [likeHint, dislikeHint, commentsHint, shareHint, remixHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(likeHint.marker.style.left).toBe("82px");
        expect(dislikeHint.marker.style.left).toBe("82px");
        expect(commentsHint.marker.style.left).toBe("82px");
        expect(shareHint.marker.style.left).toBe("82px");
        expect(remixHint.marker.style.left).toBe("82px");
        expect(likeHint.marker.style.top).toBe("26px");
        expect(dislikeHint.marker.style.top).toBe("98px");
        expect(commentsHint.marker.style.top).toBe("170px");
        expect(shareHint.marker.style.top).toBe("242px");
        expect(remixHint.marker.style.top).toBe("314px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "aligns long watch metadata control bars to the top left of each element",
    test: () => {
      const fixture = createDomFixture([
        "<div id='top-row' class='generic-watch-metadata'><div id='owner-group'><a id='owner-link' href='/creator'>Creator</a><button id='join-button' type='button' aria-label='Join creator'>Join</button><button id='subscribed-button' type='button' aria-label='Subscribed'></button><button id='notify-button' type='button' aria-label='Notification settings'></button></div><div id='actions'><div id='actions-inner'><button id='like-button' type='button' aria-label='Like'></button><button id='dislike-button' type='button' aria-label='Dislike'></button><button id='share-button' type='button' aria-label='Share'></button><button id='ask-button' type='button' aria-label='Ask'></button><button id='save-button' type='button' aria-label='Save to list'></button><button id='more-button' type='button' aria-label='More actions'></button></div></div></div>"
      ]);

      try {
        const ownerLink = document.querySelector("#owner-link");
        const joinButton = document.querySelector("#join-button");
        const subscribedButton = document.querySelector("#subscribed-button");
        const notifyButton = document.querySelector("#notify-button");
        const likeButton = document.querySelector("#like-button");
        const dislikeButton = document.querySelector("#dislike-button");
        const shareButton = document.querySelector("#share-button");
        const askButton = document.querySelector("#ask-button");
        const saveButton = document.querySelector("#save-button");
        const moreButton = document.querySelector("#more-button");
        const topRow = document.querySelector("#top-row");
        expect(ownerLink instanceof HTMLElement).toBe(true);
        expect(joinButton instanceof HTMLElement).toBe(true);
        expect(subscribedButton instanceof HTMLElement).toBe(true);
        expect(notifyButton instanceof HTMLElement).toBe(true);
        expect(likeButton instanceof HTMLElement).toBe(true);
        expect(dislikeButton instanceof HTMLElement).toBe(true);
        expect(shareButton instanceof HTMLElement).toBe(true);
        expect(askButton instanceof HTMLElement).toBe(true);
        expect(saveButton instanceof HTMLElement).toBe(true);
        expect(moreButton instanceof HTMLElement).toBe(true);
        expect(topRow instanceof HTMLElement).toBe(true);

        if (
          !(ownerLink instanceof HTMLElement) ||
          !(joinButton instanceof HTMLElement) ||
          !(subscribedButton instanceof HTMLElement) ||
          !(notifyButton instanceof HTMLElement) ||
          !(likeButton instanceof HTMLElement) ||
          !(dislikeButton instanceof HTMLElement) ||
          !(shareButton instanceof HTMLElement) ||
          !(askButton instanceof HTMLElement) ||
          !(saveButton instanceof HTMLElement) ||
          !(moreButton instanceof HTMLElement) ||
          !(topRow instanceof HTMLElement)
        ) {
          return;
        }

        const topRowRect = new DOMRect(0, 0, 1024, 72);
        topRow.getBoundingClientRect = (): DOMRect => topRowRect;
        topRow.getClientRects = (): DOMRectList => {
          const list = [topRowRect] as unknown as DOMRectList & DOMRect[];
          list.item = (index: number): DOMRect | null => list[index] ?? null;
          return list;
        };

        for (const [element, rect] of [
          [ownerLink, new DOMRect(20, 18, 140, 40)],
          [joinButton, new DOMRect(220, 20, 68, 36)],
          [subscribedButton, new DOMRect(304, 20, 120, 36)],
          [notifyButton, new DOMRect(436, 20, 52, 36)],
          [likeButton, new DOMRect(720, 20, 76, 36)],
          [dislikeButton, new DOMRect(800, 20, 44, 36)],
          [shareButton, new DOMRect(760, 20, 92, 36)],
          [askButton, new DOMRect(860, 20, 76, 36)],
          [saveButton, new DOMRect(930, 20, 68, 36)],
          [moreButton, new DOMRect(980, 20, 40, 36)]
        ] as const) {
          element.getBoundingClientRect = (): DOMRect => rect;
          element.getClientRects = (): DOMRectList => {
            const list = [rect] as unknown as DOMRectList & DOMRect[];
            list.item = (index: number): DOMRect | null => list[index] ?? null;
            return list;
          };
        }

        const makeHint = (
          element: HTMLElement,
          label: string,
          width: number,
          directive: HintMarker["directive"] = null,
          labelIcon: HintMarker["labelIcon"] = null
        ): HintMarker => {
          const marker = document.createElement("span");
          marker.getBoundingClientRect = (): DOMRect => createMarkerRect(width, 20);
          document.body.append(marker);

          return {
            element,
            marker,
            thumbnailIcon: null,
            label,
            directive,
            labelIcon,
            letters: [],
            visible: true,
            renderedTyped: "",
            markerWidth: 0,
            markerHeight: 0,
            sizeDirty: true
          };
        };

        const ownerHint = makeHint(ownerLink, "ow", 42);
        const joinHint = makeHint(joinButton, "jn", 42);
        const subscribedHint = makeHint(subscribedButton, "sb", 42);
        const notifyHint = makeHint(notifyButton, "nt", 42, "notification");
        const likeHint = makeHint(likeButton, "lk", 42, "like");
        const dislikeHint = makeHint(dislikeButton, "dk", 42, "dislike");
        const shareHint = makeHint(shareButton, "sh", 42, "share");
        const askHint = makeHint(askButton, "ak", 42);
        const saveHint = makeHint(saveButton, "sv", 42, "save");
        const moreHint = makeHint(moreButton, "mr", 50, null, "more");

        updateMarkerPositions(
          [
            ownerHint,
            joinHint,
            subscribedHint,
            notifyHint,
            likeHint,
            dislikeHint,
            shareHint,
            askHint,
            saveHint,
            moreHint
          ],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(ownerHint.marker.style.left).toBe("22px");
        expect(joinHint.marker.style.left).toBe("222px");
        expect(subscribedHint.marker.style.left).toBe("306px");
        expect(notifyHint.marker.style.left).toBe("438px");
        expect(likeHint.marker.style.left).toBe("722px");
        expect(dislikeHint.marker.style.left).toBe("810px");
        expect(shareHint.marker.style.left).toBe("766px");
        expect(askHint.marker.style.left).toBe("862px");
        expect(saveHint.marker.style.left).toBe("932px");
        expect(moreHint.marker.style.left).toBe("982px");
        expect(ownerHint.marker.style.top).toBe("20px");
        expect(joinHint.marker.style.top).toBe("20px");
        expect(subscribedHint.marker.style.top).toBe("20px");
        expect(notifyHint.marker.style.top).toBe("20px");
        expect(likeHint.marker.style.top).toBe("20px");
        expect(dislikeHint.marker.style.top).toBe("20px");
        expect(shareHint.marker.style.top).toBe("20px");
        expect(askHint.marker.style.top).toBe("20px");
        expect(saveHint.marker.style.top).toBe("20px");
        expect(moreHint.marker.style.top).toBe("20px");
      } finally {
        fixture.cleanup();
      }
    }
  },
  {
    desc: "aligns response action markers on one row and shifts copy left for space",
    test: () => {
      const fixture = createDomFixture(
        "<div id='response-actions' aria-label='Response actions' role='group' tabindex='-1'><button id='copy-response' aria-label='Copy response'>Copy</button><button id='good-response' aria-label='Good response'>Good</button><button id='bad-response' aria-label='Bad response'>Bad</button><button id='share-response' aria-label='Share'>Share</button><button id='more-response-actions' aria-label='More actions' aria-haspopup='menu'>More</button></div>"
      );

      try {
        const copyButton = document.querySelector("#copy-response");
        const goodButton = document.querySelector("#good-response");
        const badButton = document.querySelector("#bad-response");
        const shareButton = document.querySelector("#share-response");
        const moreButton = document.querySelector("#more-response-actions");
        expect(copyButton instanceof HTMLElement).toBe(true);
        expect(goodButton instanceof HTMLElement).toBe(true);
        expect(badButton instanceof HTMLElement).toBe(true);
        expect(shareButton instanceof HTMLElement).toBe(true);
        expect(moreButton instanceof HTMLElement).toBe(true);

        if (
          !(copyButton instanceof HTMLElement) ||
          !(goodButton instanceof HTMLElement) ||
          !(badButton instanceof HTMLElement) ||
          !(shareButton instanceof HTMLElement) ||
          !(moreButton instanceof HTMLElement)
        ) {
          return;
        }

        const copyRect = new DOMRect(96, 120, 32, 32);
        const goodRect = new DOMRect(144, 120, 32, 32);
        const badRect = new DOMRect(192, 120, 32, 32);
        const shareRect = new DOMRect(240, 120, 32, 32);
        const moreRect = new DOMRect(288, 120, 32, 32);
        for (const [element, rect] of [
          [copyButton, copyRect],
          [goodButton, goodRect],
          [badButton, badRect],
          [shareButton, shareRect],
          [moreButton, moreRect]
        ] as const) {
          element.getBoundingClientRect = (): DOMRect => rect;
          element.getClientRects = (): DOMRectList => {
            const list = [rect] as unknown as DOMRectList & DOMRect[];
            list.item = (index: number): DOMRect | null => list[index] ?? null;
            return list;
          };
        }

        const makeHint = (
          element: HTMLElement,
          label: string,
          width: number,
          directive: HintMarker["directive"],
          labelIcon: HintMarker["labelIcon"] = null
        ): HintMarker => {
          const marker = document.createElement("span");
          marker.getBoundingClientRect = (): DOMRect => createMarkerRect(width, 20);
          document.body.append(marker);

          return {
            element,
            marker,
            thumbnailIcon: null,
            label,
            directive,
            labelIcon,
            letters: [],
            visible: true,
            renderedTyped: "",
            markerWidth: 0,
            markerHeight: 0,
            sizeDirty: true
          };
        };

        const copyHint = makeHint(copyButton, "cp", 58, "copy");
        const goodHint = makeHint(goodButton, "wf", 42, null);
        const badHint = makeHint(badButton, "wj", 42, null);
        const shareHint = makeHint(shareButton, "wl", 42, "share");
        const moreHint = makeHint(moreButton, "wk", 50, null, "more");

        updateMarkerPositions(
          [copyHint, goodHint, badHint, shareHint, moreHint],
          "current-tab",
          false,
          "data-nav-hint-marker-variant"
        );

        expect(copyHint.marker.style.top).toBe("111px");
        expect(goodHint.marker.style.top).toBe("111px");
        expect(badHint.marker.style.top).toBe("111px");
        expect(shareHint.marker.style.top).toBe("111px");
        expect(moreHint.marker.style.top).toBe("111px");
        expect(Number.parseInt(copyHint.marker.style.left, 10)).toBe(75);
        expect(Number.parseInt(goodHint.marker.style.left, 10)).toBe(139);
        expect(Number.parseInt(badHint.marker.style.left, 10)).toBe(187);
        expect(Number.parseInt(shareHint.marker.style.left, 10)).toBe(235);
        expect(Number.parseInt(moreHint.marker.style.left, 10)).toBe(283);
        expect(Number.parseInt(goodHint.marker.style.left, 10) - (75 + 58)).toBe(6);
        expect(Number.parseInt(badHint.marker.style.left, 10) - (139 + 42)).toBe(6);
        expect(Number.parseInt(shareHint.marker.style.left, 10) - (187 + 42)).toBe(6);
        expect(Number.parseInt(moreHint.marker.style.left, 10) - (235 + 42)).toBe(6);
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