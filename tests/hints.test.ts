import { describe, expect, test } from "bun:test";
import { getPreferredDirectiveIndexes } from "~/src/core/utils/hints/hint-recognition";
import { hintDirectiveCases } from "~/tests/cases/hints.cases";
import { createDomFixture, getFixtureElements } from "~/tests/helpers/dom-fixture";

describe("hints", () => {
  for (const testCase of hintDirectiveCases) {
    test(testCase.name, () => {
      const fixture = createDomFixture([...testCase.recognized, ...testCase.ignored]);

      try {
        const elements = getFixtureElements(fixture.root);
        const result = getPreferredDirectiveIndexes(elements);
        const recognizedIndexes = new Set(testCase.recognized.map((_, index) => index));
        const ignoredIndexes = new Set(
          testCase.ignored.map((_, index) => testCase.recognized.length + index)
        );
        const selectedIndex = result[testCase.for];

        expect(selectedIndex).not.toBeUndefined();
        expect(selectedIndex).not.toBeNull();
        expect(recognizedIndexes.has(selectedIndex as number)).toBe(true);
        expect(ignoredIndexes.has(selectedIndex as number)).toBe(false);
      } finally {
        fixture.cleanup();
      }
    });
  }
});