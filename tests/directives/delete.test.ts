import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects delete actions in generic menus while ignoring neighboring actions",
  test: {
    recognizes: [
      "<div role='menuitem' tabindex='0' aria-label='Delete chat'><div class='icon'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true'><use href='/cdn/assets/sprites-core.svg#delete'></use></svg></div>Delete</div>"
    ],
    ignores: [
      "<div role='menuitem' tabindex='0'><div class='icon'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true'><use href='/cdn/assets/sprites-core.svg#share'></use></svg></div>Share</div>",
      "<div role='menuitem' tabindex='0'>Rename</div>",
      "<div role='menuitem' tabindex='0'>Archive</div>",
      "<div role='menuitem' tabindex='0'>Pin chat</div>"
    ]
  }
};

describe("delete directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("delete", directiveTestCase.test);
  });
});