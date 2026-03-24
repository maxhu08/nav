import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects save actions while ignoring unrelated controls",
  test: {
    recognizes: [
      "<button type='button' aria-label='Save to library'>Save</button>",
      "<tp-yt-paper-item class='style-scope ytd-menu-service-item-renderer' style-target='host' role='option' tabindex='0' aria-disabled='false'><yt-icon class='style-scope ytd-menu-service-item-renderer'><span class='yt-icon-shape style-scope yt-icon ytSpecIconShapeHost'><div style='width: 100%; height: 100%; display: block; fill: currentcolor;'><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true' style='pointer-events: none; display: inherit; width: 100%; height: 100%;'><path d='M19 2H5a2 2 0 00-2 2v16.887c0 1.266 1.382 2.048 2.469 1.399L12 18.366l6.531 3.919c1.087.652 2.469-.131 2.469-1.397V4a2 2 0 00-2-2ZM5 20.233V4h14v16.233l-6.485-3.89-.515-.309-.515.309L5 20.233Z'></path></svg></div></span></yt-icon><yt-formatted-string class='style-scope ytd-menu-service-item-renderer'>Save</yt-formatted-string><ytd-badge-supported-renderer class='style-scope ytd-menu-service-item-renderer' system-icons='' use-badge-shape='' hidden=''></ytd-badge-supported-renderer></tp-yt-paper-item>"
    ],
    ignores: [
      "<button type='button' aria-label='Share'>Share</button>",
      "<button type='submit' aria-label='Send reply'>Send</button>"
    ]
  }
};

describe("save directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("save", directiveTestCase.test);
  });
});