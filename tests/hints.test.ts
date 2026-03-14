import { describe, expect, test } from "bun:test";
import {
  getHintableElements,
  getPreferredDirectiveIndexes
} from "~/src/core/utils/hints/hint-recognition";
import type { ReservedHintDirective } from "~/src/utils/hint-reserved-label-directives";
import { hintDirectiveCases } from "~/tests/cases/hints.cases";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

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

  test("collects visible native attach button when hit testing misses it", () => {
    const fixture = createDomFixture(
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button>"
    );

    try {
      document.elementsFromPoint = () => [];

      const elements = getHintableElements("current-tab");
      const directives = getPreferredDirectiveIndexes(elements);

      expect(elements.length).toBe(1);
      expect(directives.attach).toBe(0);
    } finally {
      fixture.cleanup();
    }
  });

  test("prefers the ChatGPT close sidebar button for @sidebar", () => {
    const fixture = createDomFixture(
      "<div id='sidebar-header' class='h-header-height flex items-center justify-between'><a data-sidebar-item='true' aria-label='Home' class='text-token-text-primary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50' href='/' data-discover='true'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon-lg'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#55180d' fill='currentColor'></use></svg></a><div class='flex'><button class='text-token-text-tertiary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50 no-draggable cursor-w-resize rtl:cursor-e-resize' aria-expanded='true' aria-controls='stage-slideover-sidebar' aria-label='Close sidebar' data-testid='close-sidebar-button' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' data-rtl-flip='' class='icon max-md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#836f7a' fill='currentColor'></use></svg><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#85f94b' fill='currentColor'></use></svg></button></div></div>"
    );

    try {
      const elements = getHintableElements("current-tab");
      const directives = getPreferredDirectiveIndexes(elements);
      const sidebarIndex = directives.sidebar;

      expect(sidebarIndex).not.toBeUndefined();
      expect(sidebarIndex).not.toBeNull();
      expect(elements[sidebarIndex as number]?.getAttribute("data-testid")).toBe(
        "close-sidebar-button"
      );
    } finally {
      fixture.cleanup();
    }
  });
});