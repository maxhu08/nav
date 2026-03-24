import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects notification controls while ignoring unrelated buttons",
  test: {
    recognizes: [
      "<button type='button' aria-label='Notifications'><svg aria-hidden='true'></svg></button>",
      "<a href='/notifications' title='Notification center'>Alerts</a>",
      "<button type='button' data-testid='notification-bell-button' aria-haspopup='menu' aria-expanded='false'><svg aria-hidden='true'></svg></button>",
      "<button type='button' aria-labelledby='notification-label' aria-haspopup='true' aria-expanded='false'><svg aria-hidden='true'></svg></button><span id='notification-label'>Inbox</span>",
      "<a href='/inbox' aria-haspopup='true'><svg aria-hidden='true'></svg></a>"
    ],
    ignores: [
      "<button type='button' aria-label='Share'>Share</button>",
      "<button type='button' aria-label='Open profile menu'>Profile</button>"
    ]
  }
};

describe("notification directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("notification", directiveTestCase.test);
  });
});