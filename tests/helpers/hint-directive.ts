import { expect } from "bun:test";
import {
  getHintableElements,
  getPreferredDirectiveIndexes
} from "~/src/core/utils/hints/hint-recognition";
import type { ReservedHintDirective } from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import type { DirectiveTestType } from "~/tests/types";

export const runDirectiveCase = (
  directive: ReservedHintDirective,
  testCase: DirectiveTestType
): void => {
  const fixture = createDomFixture([...testCase.recognizes, ...testCase.ignores]);

  try {
    const elements = getHintableElements("current-tab");
    const result = getPreferredDirectiveIndexes(elements);
    const recognizedIndexes = new Set(testCase.recognizes.map((_, index) => index));
    const ignoredIndexes = new Set(
      testCase.ignores.map((_, index) => testCase.recognizes.length + index)
    );
    const selectedIndex = result[directive];

    expect(selectedIndex).not.toBeUndefined();
    expect(selectedIndex).not.toBeNull();
    expect(recognizedIndexes.has(selectedIndex as number)).toBe(true);
    expect(ignoredIndexes.has(selectedIndex as number)).toBe(false);
  } finally {
    fixture.cleanup();
  }
};