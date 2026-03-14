import { describe, expect, test } from "bun:test";
import {
  getHintableElements,
  getPreferredDirectiveIndexes
} from "~/src/core/utils/hints/hint-recognition";
import { assignHintLabels } from "~/src/core/utils/hints/pipeline";
import {
  createEmptyReservedHintLabels,
  type ReservedHintDirective
} from "~/src/utils/hint-reserved-label-directives";
import { hintDirectiveCases, hintScenarioCases } from "~/tests/cases/hints.cases";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import type { HintRect, HintScenarioCase } from "~/tests/types";

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

const applyScenario = (scenario: HintScenarioCase): void => {
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

describe("hints", () => {
  for (const [directive, testCase] of Object.entries(hintDirectiveCases) as Array<
    [ReservedHintDirective, (typeof hintDirectiveCases)[ReservedHintDirective]]
  >) {
    test(testCase.desc, () => {
      const fixture = createDomFixture([...testCase.recognizes, ...testCase.ignored]);

      try {
        const elements = getHintableElements("current-tab");
        const result = getPreferredDirectiveIndexes(elements);
        const recognizedIndexes = new Set(testCase.recognizes.map((_, index) => index));
        const ignoredIndexes = new Set(
          testCase.ignored.map((_, index) => testCase.recognizes.length + index)
        );
        const selectedIndex = result[directive];

        expect(selectedIndex).not.toBeUndefined();
        expect(selectedIndex).not.toBeNull();
        expect(recognizedIndexes.has(selectedIndex as number)).toBe(true);
        expect(ignoredIndexes.has(selectedIndex as number)).toBe(false);
      } finally {
        fixture.cleanup();
      }
    });
  }

  for (const scenario of hintScenarioCases) {
    test(scenario.desc, () => {
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
          for (const [directive, selector] of Object.entries(
            scenario.expect.directiveTargets
          ) as Array<[ReservedHintDirective, string]>) {
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

            expect(targets[index]?.element).toBe(expectedElement);
            expect(targets[index]?.directive ?? null).toBe(expectedTarget.directive);
          });
        }
      } finally {
        fixture.cleanup();
      }
    });
  }
});