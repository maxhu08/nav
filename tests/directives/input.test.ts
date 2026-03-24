import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects search-style text inputs while ignoring unrelated buttons",
  test: {
    recognizes: ["<input type='text' aria-label='Search' />"],
    ignores: ["<button>Other</button>"]
  }
};

describe("input directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("input", directiveTestCase.test);
  });
});