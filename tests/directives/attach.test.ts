import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects upload and attachment controls while ignoring unrelated actions",
  test: {
    recognizes: [
      "<input type='file' aria-label='Upload file' />",
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button>",
      "<button type='button' class='toolbar-action icon-paperclip' title='Choose from computer' data-testid='paperclip-button'></button>",
      "<button type='button' aria-label='Update profile photo' aria-busy='false'><img alt='First Last' src='https://example.com/avatar.png' /></button>"
    ],
    ignores: [
      "<button>Other</button>",
      "<div class='nav-div nav-active' id='icp-nav-flyout'><a href='/customer-preferences/edit?ie=UTF8&amp;preferencesReturnUrl=%2F&amp;ref_=topnav_lang' class='nav-a nav-a-2 icp-link-style-2' aria-label='Choose a language for shopping in Amazon United States. The current selection is English (EN).'><span class='icp-nav-link-inner'><span class='nav-line-1'></span><span class='nav-line-2'><span class='icp-nav-flag icp-nav-flag-us icp-nav-flag-lop' role='img' aria-label='United States'></span><div>EN</div></span></span></a><button class='nav-flyout-button nav-icon nav-arrow nav-active' aria-label='Expand to Change Language or Country' tabindex='0' style='visibility: visible;' aria-expanded='true'></button></div>"
    ]
  }
};

describe("attach directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("attach", directiveTestCase.test);
  });
});