import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects search-style text inputs while ignoring unrelated buttons",
  test: {
    recognizes: [
      "<input type='text' aria-label='Search' />",
      "<button type='button' aria-label='Search or jump to'><span>Type <kbd>/</kbd> to search</span></button>"
    ],
    ignores: ["<button>Other</button>"]
  }
};

describe("input directive primary launcher priority", () => {
  test("prefers a primary search launcher over incidental inputs", () => {
    runDirectiveCase("input", {
      recognizes: [
        "<button type='button' aria-label='Search or jump to'><span>Type <kbd>/</kbd> to search</span></button>"
      ],
      ignores: [
        "<input type='text' aria-label='Filter list' />",
        "<textarea aria-label='Comment'></textarea>",
        "<button>Other</button>"
      ]
    });
  });
});

describe("input directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("input", directiveTestCase.test);
  });
});