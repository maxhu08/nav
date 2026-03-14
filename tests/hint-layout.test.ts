import { describe, expect, test } from "bun:test";
import { updateMarkerPositions } from "~/src/core/utils/hints/layout";
import type { HintMarker } from "~/src/core/utils/hints/types";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createMarkerRect = (width: number, height: number): DOMRect =>
  new DOMRect(0, 0, width, height);

describe("hint marker layout", () => {
  test("avoids thumbnail marker placements covered by a sticky navbar", () => {
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
  });

  test("hides markers for targets that scrolled fully offscreen", () => {
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
  });

  test("keeps default markers for thumbnail-like containers without actual media", () => {
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
  });

  test("avoids thumbnail marker placements covered by a fixed popup", () => {
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
      expect(marker.style.top).toBe("4px");
    } finally {
      fixture.cleanup();
    }
  });
});