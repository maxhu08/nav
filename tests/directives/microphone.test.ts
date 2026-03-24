import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects microphone controls while ignoring unrelated buttons",
  test: {
    recognizes: [
      "<button type='button' aria-label='Use microphone'>Use microphone</button>",
      "<button type='button' data-testid='mic-button' title='Push to talk'>Mic</button>"
    ],
    ignores: ["<button type='button'>Other</button>"]
  }
};

describe("microphone directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("microphone", directiveTestCase.test);
  });

  test("prefers a dictate control over a generic voice start control", () => {
    runDirectiveCase("microphone", {
      recognizes: [
        "<button aria-label='Dictate button' type='button' class='composer-btn h-9 min-h-9 w-9 min-w-9'><svg aria-hidden='true'></svg></button>"
      ],
      ignores: [
        "<button type='button' aria-label='Start Voice' class='composer-submit-button-color'><svg aria-hidden='true'></svg></button>"
      ]
    });
  });
});