import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects sharing and repost controls while ignoring unrelated buttons",
  test: {
    recognizes: [
      "<button aria-label='Share this post'>Share</button>",
      "<button data-testid='repost-button' title='Repost'>Repost</button>"
    ],
    ignores: ["<button>Other</button>"]
  }
};

describe("share directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("share", directiveTestCase.test);
  });
});