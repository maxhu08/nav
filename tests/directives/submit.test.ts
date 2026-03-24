import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects submit-style form actions while ignoring unrelated buttons",
  test: {
    recognizes: [
      "<button type='submit'>Submit</button>",
      "<form><button type='button'>Reply</button></form>",
      "<form><input type='submit' value='Publish' /></form>"
    ],
    ignores: [
      "<button>Other</button>",
      "<div class='flex-0'><div class='flex flex-col gap-3 sm:flex-row-reverse mt-5 sm:mt-4 flex w-full flex-row-reverse'><button class='btn relative group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-style:solid] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] btn-danger' data-testid='delete-conversation-confirm-button'><div class='flex items-center justify-center'>Delete</div></button><button class='btn relative group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-style:solid] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] btn-secondary'><div class='flex items-center justify-center'>Cancel</div></button></div></div>"
    ]
  }
};

describe("submit directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("submit", directiveTestCase.test);
  });
});