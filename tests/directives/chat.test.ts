import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects chat launcher controls",
  test: {
    recognizes: [
      "<div><a data-component='IconButton' type='button' aria-labelledby='copilot-tooltip' href='/copilot'><svg aria-hidden='true'></svg></a><span id='copilot-tooltip'>Chat with Copilot</span></div>",
      "<section aria-label='Chat widget'><button type='button' data-test-id='BotLauncher' aria-label='Open chat'>Open chat</button></section>",
      "<button type='button' aria-label='Open Copilot...' aria-haspopup='true'><svg aria-hidden='true'></svg></button>"
    ],
    ignores: [
      "<button type='button' aria-label='Share'>Share</button>",
      "<button type='button' aria-label='Open menu'>Menu</button>"
    ]
  }
};

describe("chat directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("chat", directiveTestCase.test);
  });
});