import { describe, expect, test } from "bun:test";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_LABEL_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import {
  createMarkerPlacementState,
  positionMarkerElement,
  positionMarkerElementToRightOf
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

  test("keeps icon markers aligned with the same left edge as label-only markers", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      setViewport(300, 200);
      const placementState = createMarkerPlacementState();
      const marker = createMarkerElement(60, 20);
      const label = document.createElement("span");
      const icon = document.createElement("span");

      label.setAttribute(MARKER_LABEL_ATTRIBUTE, "true");
      icon.setAttribute(MARKER_ICON_ATTRIBUTE, "true");
      Object.defineProperty(label, "offsetWidth", {
        configurable: true,
        get: () => 40
      });

      marker.append(label, icon);
      fixture.document.body.append(marker);

      positionMarkerElement(marker, new DOMRect(10, 10, 20, 20), placementState);

      expect(marker.style.left).toBe("20px");
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps icon markers inside the viewport edge gap", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      setViewport(300, 200);
      const placementState = createMarkerPlacementState();
      const marker = createMarkerElement(60, 20);
      const label = document.createElement("span");
      const icon = document.createElement("span");

      label.setAttribute(MARKER_LABEL_ATTRIBUTE, "true");
      icon.setAttribute(MARKER_ICON_ATTRIBUTE, "true");
      Object.defineProperty(label, "offsetWidth", {
        configurable: true,
        get: () => 40
      });

      marker.append(label, icon);
      fixture.document.body.append(marker);

      positionMarkerElement(marker, new DOMRect(0, 10, 20, 20), placementState);

      expect(marker.style.left).toBe("20px");
    } finally {
      fixture.cleanup();
    }
  });

  test("treats icon markers as overlapping based on their visual bounds", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      setViewport(300, 200);
      const placementState = createMarkerPlacementState();
      const firstMarker = createMarkerElement(60, 20);
      const secondMarker = createMarkerElement(60, 20);

      for (const marker of [firstMarker, secondMarker]) {
        const label = document.createElement("span");
        const icon = document.createElement("span");

        label.setAttribute(MARKER_LABEL_ATTRIBUTE, "true");
        icon.setAttribute(MARKER_ICON_ATTRIBUTE, "true");
        Object.defineProperty(label, "offsetWidth", {
          configurable: true,
          get: () => 40
        });

        marker.append(label, icon);
      }

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

  test("can place a marker to the right of another marker with the minimum gap", () => {
    const fixture = createDomFixture("<div></div>");

    try {
      setViewport(300, 200);
      const placementState = createMarkerPlacementState();
      const inputMarker = createMarkerElement(60, 20);
      const eraseMarker = createMarkerElement(40, 20);

      fixture.document.body.append(inputMarker, eraseMarker);

      inputMarker.style.left = "20px";
      inputMarker.style.top = "10px";

      positionMarkerElementToRightOf(eraseMarker, inputMarker, placementState);

      expect(eraseMarker.style.left).toBe(`${20 + 60 + HINT_MARKER_MIN_GAP}px`);
      expect(eraseMarker.style.top).toBe("10px");
    } finally {
      fixture.cleanup();
    }
  });
});