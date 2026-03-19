import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects download and export controls while ignoring unrelated buttons",
  test: {
    recognizes: [
      "<a href='/files/report.pdf' download aria-label='Download report pdf'>Download</a>",
      "<button type='button' data-testid='download-button' title='Export image'>Export</button>"
    ],
    ignored: ["<button type='button'>Other</button>"]
  }
};

describe("download directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("download", directiveTestCase.test);
  });
});