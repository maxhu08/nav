import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects sidebar toggle controls while ignoring non-sidebar menus",
  test: {
    recognizes: [
      "<button aria-label='Open sidebar' aria-controls='left-sidebar'>Menu</button>",
      "<div id='sidebar-header' class='h-header-height flex items-center justify-between'><a data-sidebar-item='true' aria-label='Home' class='text-token-text-primary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50' href='/' data-discover='true'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon-lg'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#55180d' fill='currentColor'></use></svg></a><div class='flex'><button class='text-token-text-tertiary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50 no-draggable cursor-w-resize rtl:cursor-e-resize' aria-expanded='true' aria-controls='stage-slideover-sidebar' aria-label='Close sidebar' data-testid='close-sidebar-button' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' data-rtl-flip='' class='icon max-md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#836f7a' fill='currentColor'></use></svg><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#85f94b' fill='currentColor'></use></svg></button></div></div>"
    ],
    ignores: [
      "<button aria-label='Open profile menu' data-testid='profile-button' class='user-select-none group ps-2 focus:outline-0' type='button' id='radix-_R_2j9muvb8php8t6kcm_' aria-haspopup='menu' aria-expanded='false' data-state='closed'><div class='touch:h-10 touch:w-10 group-keyboard-focused:focus-ring group-hover:bg-token-interactive-bg-secondary-selected flex h-9 w-9 items-center justify-center rounded-full'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon-lg'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#975ff3' fill='currentColor'></use></svg></div></button>"
    ]
  }
};

describe("sidebar directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("sidebar", directiveTestCase.test);
  });
});