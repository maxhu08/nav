import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects previous-navigation links while ignoring unrelated buttons",
  test: {
    recognizes: ["<a href='/prev' rel='prev'>Previous</a>"],
    ignores: ["<button>Other</button>"]
  }
};

describe("prev directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("prev", directiveTestCase.test);
  });
});