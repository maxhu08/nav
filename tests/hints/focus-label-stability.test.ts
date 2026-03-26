import { describe, expect, test } from "bun:test";
import { getHintableElements } from "~/src/core/utils/hints/hint-recognition";
import { assignHintLabels } from "~/src/core/utils/hints/pipeline";
import { createEmptyReservedHintLabels } from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

const applyRect = (selector: string, rect: DOMRect): void => {
  const element = document.querySelector(selector);
  expect(element instanceof HTMLElement).toBe(true);
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.getBoundingClientRect = (): DOMRect => rect;
  element.getClientRects = (): DOMRectList => createRectList(rect);
};

describe("focus hint label stability", () => {
  test("keeps expand and collapse labels stable across repeated activations on the page", () => {
    const fixture = createDomFixture(
      "<button id='generic-action' type='button'>Action</button><button id='expand-section' type='button' aria-controls='section-a' aria-expanded='false'>Section A</button><button id='collapse-section' type='button' aria-controls='section-b' aria-expanded='true'>Section B</button>"
    );

    try {
      const labelSettings = {
        minHintLabelLength: 2,
        hintAlphabet: "asdfjkl",
        reservedHintPrefixes: new Set<string>(),
        avoidedAdjacentHintPairs: {}
      };
      const stableFocusHintLabels = new Map<string, string>();

      applyRect("#generic-action", new DOMRect(40, 40, 32, 32));
      applyRect("#expand-section", new DOMRect(40, 120, 32, 32));
      applyRect("#collapse-section", new DOMRect(40, 200, 32, 32));

      const firstTargets = assignHintLabels(
        getHintableElements("current-tab"),
        createEmptyReservedHintLabels(),
        labelSettings,
        stableFocusHintLabels
      );
      const firstExpandLabel = firstTargets.find(
        (target) => target.element.id === "expand-section"
      )?.label;
      const firstCollapseLabel = firstTargets.find(
        (target) => target.element.id === "collapse-section"
      )?.label;

      expect(firstExpandLabel).toBeTruthy();
      expect(firstCollapseLabel).toBeTruthy();

      const insertedButton = document.createElement("button");
      insertedButton.id = "new-leading-action";
      insertedButton.type = "button";
      insertedButton.textContent = "New leading action";
      document.body.prepend(insertedButton);
      applyRect("#new-leading-action", new DOMRect(40, 0, 32, 32));

      const secondTargets = assignHintLabels(
        getHintableElements("current-tab"),
        createEmptyReservedHintLabels(),
        labelSettings,
        stableFocusHintLabels
      );

      expect(secondTargets.find((target) => target.element.id === "expand-section")?.label).toBe(
        firstExpandLabel
      );
      expect(secondTargets.find((target) => target.element.id === "collapse-section")?.label).toBe(
        firstCollapseLabel
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps the same label when a toggle flips between expand and collapse", () => {
    const fixture = createDomFixture(
      "<button id='section-toggle' type='button' aria-controls='section-a' aria-expanded='false'>Section A</button>"
    );

    try {
      const labelSettings = {
        minHintLabelLength: 2,
        hintAlphabet: "asdfjkl",
        reservedHintPrefixes: new Set<string>(),
        avoidedAdjacentHintPairs: {}
      };
      const stableFocusHintLabels = new Map<string, string>();

      applyRect("#section-toggle", new DOMRect(40, 40, 32, 32));

      const toggle = document.querySelector("#section-toggle");
      expect(toggle instanceof HTMLElement).toBe(true);
      if (!(toggle instanceof HTMLElement)) {
        return;
      }

      const firstTargets = assignHintLabels(
        getHintableElements("current-tab"),
        createEmptyReservedHintLabels(),
        labelSettings,
        stableFocusHintLabels
      );
      const firstTarget = firstTargets.find((target) => target.element.id === "section-toggle");

      expect(firstTarget?.labelIcon).toBe("expand");
      expect(firstTarget?.label).toBeTruthy();

      toggle.setAttribute("aria-expanded", "true");

      const secondTargets = assignHintLabels(
        getHintableElements("current-tab"),
        createEmptyReservedHintLabels(),
        labelSettings,
        stableFocusHintLabels
      );
      const secondTarget = secondTargets.find((target) => target.element.id === "section-toggle");

      expect(secondTarget?.labelIcon).toBe("collapse");
      expect(secondTarget?.label).toBe(firstTarget?.label);
    } finally {
      fixture.cleanup();
    }
  });
});