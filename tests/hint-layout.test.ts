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