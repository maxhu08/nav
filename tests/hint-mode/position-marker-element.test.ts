import { describe, expect, test } from "bun:test";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  createMarkerPlacementState,
  positionMarkerElement
} from "~/src/core/utils/hint-mode/rendering/position-marker-element";
import { HINT_MARKER_MIN_GAP } from "~/src/core/utils/hint-mode/shared/constants";

const createMarkerElement = (width: number, height: number): HTMLDivElement => {
  const marker = document.createElement("div");

  Object.defineProperty(marker, "offsetWidth", {
    configurable: true,
    get: () => width
  });
  Object.defineProperty(marker, "offsetHeight", {
    configurable: true,
    get: () => height
  });

  return marker;
};

const setViewport = (width: number, height: number): void => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height
  });
};

describe("positionMarkerElement", () => {
  test("moves below the previous marker when the preferred position conflicts", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      setViewport(300, 200);
      const placementState = createMarkerPlacementState();
      const firstMarker = createMarkerElement(120, 20);
      const secondMarker = createMarkerElement(120, 20);

      fixture.document.body.append(firstMarker, secondMarker);

      positionMarkerElement(firstMarker, new DOMRect(10, 10, 20, 20), placementState);
      positionMarkerElement(secondMarker, new DOMRect(10, 10, 20, 20), placementState);

      expect(secondMarker.style.left).toBe(firstMarker.style.left);
      expect(Number.parseInt(secondMarker.style.top, 10)).toBe(
        Number.parseInt(firstMarker.style.top, 10) + 20 + HINT_MARKER_MIN_GAP
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps the preferred position when the previous marker does not conflict", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      setViewport(300, 200);
      const placementState = createMarkerPlacementState();
      const firstMarker = createMarkerElement(40, 20);
      const secondMarker = createMarkerElement(40, 20);

      fixture.document.body.append(firstMarker, secondMarker);

      positionMarkerElement(firstMarker, new DOMRect(10, 10, 20, 20), placementState);
      positionMarkerElement(secondMarker, new DOMRect(90, 10, 20, 20), placementState);

      expect(firstMarker.style.top).toBe("10px");
      expect(secondMarker.style.top).toBe("10px");
      expect(secondMarker.style.left).toBe("90px");
    } finally {
      fixture.cleanup();
    }
  });

  test("still clamps the shifted marker to the viewport", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      setViewport(120, 60);
      const placementState = createMarkerPlacementState();
      const firstMarker = createMarkerElement(90, 20);
      const secondMarker = createMarkerElement(90, 20);

      fixture.document.body.append(firstMarker, secondMarker);

      positionMarkerElement(firstMarker, new DOMRect(10, 10, 20, 20), placementState);
      positionMarkerElement(secondMarker, new DOMRect(10, 10, 20, 20), placementState);

      expect(secondMarker.style.left).toBe(firstMarker.style.left);
      expect(secondMarker.style.top).toBe("32px");
    } finally {
      fixture.cleanup();
    }
  });
});