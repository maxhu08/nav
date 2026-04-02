import { describe, expect, test } from "bun:test";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { renderHintTargets } from "~/src/core/utils/hint-mode/rendering/render-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

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

const setRect = (
  element: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number
): void => {
  const rect = new DOMRect(left, top, width, height);
  element.getBoundingClientRect = (): DOMRect => rect;
  element.getClientRects = (): DOMRectList => {
    const list = [rect] as unknown as DOMRectList & DOMRect[];
    list.item = (index: number): DOMRect | null => list[index] ?? null;
    return list;
  };
};

const setMarkerSize = (marker: HTMLDivElement): void => {
  Object.defineProperty(marker, "offsetWidth", {
    configurable: true,
    get: () => 48
  });
  Object.defineProperty(marker, "offsetHeight", {
    configurable: true,
    get: () => 20
  });
};

describe("ChatGPT project header hint marker placement", () => {
  test("keeps the expando marker on the chevron instead of the section label", () => {
    const fixture = createDomFixture(`
      <div class="group/sidebar-expando-section mb-2">
        <button id="projects-toggle" aria-expanded="true" class="text-token-text-tertiary flex w-full items-center justify-start gap-0.5 px-4 py-1.5" type="button">
          <h2 class="__menu-label" data-no-spacing="true">Projects</h2>
          <svg id="projects-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true" class="invisible h-3 w-3 shrink-0 group-hover/sidebar-expando-section:visible"></svg>
        </button>
      </div>
    `);

    try {
      setViewport(420, 300);

      const toggle = document.querySelector<HTMLElement>("#projects-toggle");
      const icon = document.querySelector("#projects-toggle-icon");
      expect(toggle).toBeInstanceOf(HTMLElement);
      expect(icon).toBeInstanceOf(SVGElement);

      setRect(toggle as HTMLElement, 12, 24, 180, 24);
      setRect(icon as unknown as HTMLElement, 118, 28, 12, 12);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const target = targets.find((candidate) => candidate.element === toggle);
      expect(target).toBeDefined();
      expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("focus-action");
      expect(Number.parseFloat(target?.marker.style.left ?? "0")).toBeCloseTo(21.6, 5);
      expect(Number.parseFloat(target?.marker.style.top ?? "0")).toBe(24);
    } finally {
      fixture.cleanup();
    }
  });
});