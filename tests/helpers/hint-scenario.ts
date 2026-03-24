import { expect } from "bun:test";
import {
  getHintableElements,
  getPreferredDirectiveIndexes
} from "~/src/core/utils/hints/hint-recognition";
import { assignHintLabels } from "~/src/core/utils/hints/pipeline";
import {
  createEmptyReservedHintLabels,
  type ReservedHintDirective
} from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import type { HintRect, HintScenarioTestType } from "~/tests/types";

const createRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

const applyRect = (selector: string, rectSpec: HintRect): void => {
  const element = document.querySelector(selector);
  expect(element instanceof HTMLElement).toBe(true);
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const rect = new DOMRect(rectSpec.left, rectSpec.top, rectSpec.width, rectSpec.height);
  element.getBoundingClientRect = (): DOMRect => rect;
  element.getClientRects = (): DOMRectList => createRectList(rect);
};

const applyScenario = (scenario: HintScenarioTestType): void => {
  if (scenario.geometry) {
    for (const [selector, rectSpec] of Object.entries(scenario.geometry)) {
      applyRect(selector, rectSpec);
    }
  }

  if (scenario.elementsFromPointSelectors) {
    const selectors = scenario.elementsFromPointSelectors;
    document.elementsFromPoint = () =>
      selectors
        .map((selector) => document.querySelector(selector))
        .filter((element): element is Element => element instanceof Element);
  }
};

export const runHintScenarioCase = (scenario: HintScenarioTestType): void => {
  const fixture = createDomFixture(scenario.fixtures);

  try {
    applyScenario(scenario);

    const elements = getHintableElements("current-tab");
    const directives = getPreferredDirectiveIndexes(elements);

    if (scenario.expect.hintableSelectors) {
      expect(elements).toHaveLength(scenario.expect.hintableSelectors.length);

      scenario.expect.hintableSelectors.forEach((selector, index) => {
        const expectedElement = document.querySelector(selector);
        expect(expectedElement instanceof HTMLElement).toBe(true);
        if (!(expectedElement instanceof HTMLElement)) {
          return;
        }

        expect(elements[index]).toBe(expectedElement);
      });
    }

    if (scenario.expect.directiveTargets) {
      for (const [directive, selector] of Object.entries(scenario.expect.directiveTargets) as Array<
        [ReservedHintDirective, string]
      >) {
        const directiveIndex = directives[directive];
        expect(directiveIndex).not.toBeUndefined();
        expect(directiveIndex).not.toBeNull();

        const expectedElement = document.querySelector(selector);
        expect(expectedElement instanceof HTMLElement).toBe(true);
        if (!(expectedElement instanceof HTMLElement)) {
          return;
        }

        expect(elements[directiveIndex as number]).toBe(expectedElement);
      }
    }

    if (scenario.expect.missingDirectiveTargets) {
      for (const directive of scenario.expect.missingDirectiveTargets) {
        expect(directives[directive]).toBeUndefined();
      }
    }

    if (scenario.expect.assignedTargets) {
      const reservedLabels = createEmptyReservedHintLabels();
      Object.assign(reservedLabels, scenario.reservedLabels ?? {});
      const targets = assignHintLabels(elements, reservedLabels, {
        minHintLabelLength: 2,
        hintAlphabet: "asdfjkl",
        reservedHintPrefixes: new Set(),
        avoidedAdjacentHintPairs: {}
      });

      expect(targets).toHaveLength(scenario.expect.assignedTargets.length);

      scenario.expect.assignedTargets.forEach((expectedTarget, index) => {
        const expectedElement = document.querySelector(expectedTarget.selector);
        expect(expectedElement instanceof HTMLElement).toBe(true);
        if (!(expectedElement instanceof HTMLElement)) {
          return;
        }

        expect(targets[index].element).toBe(expectedElement);
        expect(targets[index].directive ?? null).toBe(expectedTarget.directive);
        expect(targets[index].labelIcon ?? null).toBe(expectedTarget.labelIcon ?? null);
      });
    }
  } finally {
    fixture.cleanup();
  }
};