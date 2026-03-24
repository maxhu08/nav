import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects copy actions while ignoring unrelated controls",
  test: {
    recognizes: [
      "<a title='copy'><i class='icon-copy'></i></a>",
      "<div aria-label='Response actions' class='response-actions action-strip pointer-events-none reveal-on-hover' role='group' tabindex='-1'><button class='icon-button' aria-label='Copy response' data-testid='copy-turn-action-button' data-state='closed'><span><svg aria-hidden='true' class='icon'><use href='/assets/sprites.svg#copy-icon' fill='currentColor'></use></svg></span></button><button class='icon-button' aria-label='Good response' aria-pressed='false' data-testid='good-response-turn-action-button' data-state='closed'><span><svg aria-hidden='true' class='icon'><use href='/assets/sprites.svg#good-icon' fill='currentColor'></use></svg></span></button><button class='icon-button' aria-label='Bad response' aria-pressed='false' data-testid='bad-response-turn-action-button' data-state='closed'><span><svg aria-hidden='true' class='icon'><use href='/assets/sprites.svg#bad-icon' fill='currentColor'></use></svg></span></button><button class='icon-button' aria-label='Share' data-state='closed'><span><svg aria-hidden='true' class='icon'><use href='/assets/sprites.svg#share-icon' fill='currentColor'></use></svg></span></button><span data-state='closed'><button type='button' id='model-switch-button' aria-haspopup='menu' aria-expanded='false' data-state='closed' class='icon-button compact' aria-label='Switch model'><div><svg aria-hidden='true' class='icon'><use href='/assets/sprites.svg#model-icon' fill='currentColor'></use></svg></div></button></span><button class='icon-button compact' aria-label='More actions' type='button' id='more-actions-button' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg aria-hidden='true' class='icon'><use href='/assets/sprites.svg#more-icon' fill='currentColor'></use></svg></button></div>"
    ],
    ignores: [
      "<a title='open'><i class='rd-icon-external-link'></i></a>",
      "<button type='button' aria-label='Share'>Share</button>"
    ]
  }
};

describe("copy directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("copy", directiveTestCase.test);
  });
});