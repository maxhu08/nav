import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects home navigation links while ignoring unrelated buttons",
  test: {
    recognizes: ["<a href='/' rel='home'>Home</a>"],
    ignores: ["<button>Other</button>"]
  }
};

describe("home directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("home", directiveTestCase.test);
  });
});