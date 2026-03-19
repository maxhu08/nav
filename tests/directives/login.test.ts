import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects sign-in controls while ignoring unrelated buttons",
  test: {
    recognizes: [
      "<a href='/signin' aria-label='Sign in to continue'>Sign in</a>",
      "<button type='button' data-testid='login-button' title='Log in'>Log in</button>"
    ],
    ignored: ["<button type='button'>Other</button>"]
  }
};

describe("login directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("login", directiveTestCase.test);
  });
});