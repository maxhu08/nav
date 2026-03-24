import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import type { DirectiveTestCase } from "~/tests/types";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects like actions while ignoring unrelated text matches",
  test: {
    recognizes: [
      "<button class='yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--segmented-start yt-spec-button-shape-next--enable-backdrop-filter-experiment' title='' aria-pressed='false' aria-label='like this video along with 635,496 other people' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'><yt-icon><span class='yt-icon-shape'><div><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true'><path d='M9.221 1.795a1 1 0 011.109-.656l1.04.173a4 4 0 013.252 4.784L14 9h4.061a3.664 3.664 0 013.576 2.868A3.68 3.68 0 0121 14.85l.02.087A3.815 3.815 0 0120 18.5v.043l-.01.227a2.82 2.82 0 01-.135.663l-.106.282A3.754 3.754 0 0116.295 22h-3.606l-.392-.007a12.002 12.002 0 01-5.223-1.388l-.343-.189-.27-.154a2.005 2.005 0 00-.863-.26l-.13-.004H3.5a1.5 1.5 0 01-1.5-1.5V12.5A1.5 1.5 0 013.5 11h1.79l.157-.013a1 1 0 00.724-.512l.063-.145 2.987-8.535Zm-1.1 9.196A3 3 0 015.29 13H4v4.998h1.468a4 4 0 011.986.528l.27.155.285.157A10 10 0 0012.69 20h3.606c.754 0 1.424-.483 1.663-1.2l.03-.126a.819.819 0 00.012-.131v-.872l.587-.586c.388-.388.577-.927.523-1.465l-.038-.23-.02-.087-.21-.9.55-.744A1.663 1.663 0 0018.061 11H14a2.002 2.002 0 01-1.956-2.418l.623-2.904a2 2 0 00-1.626-2.392l-.21-.035-2.71 7.741Z'></path></svg></div></span></yt-icon></div><div class='yt-spec-button-shape-next__button-text-content'>635K</div></button>",
      "<button class='yt-spec-button-shape-next yt-spec-button-shape-next--segmented-start' aria-pressed='true' aria-label='Unlike this video'>Liked</button>",
      "<div class='yt-spec-button-shape-next yt-spec-button-shape-next--segmented-start'><button aria-pressed='true' aria-label='Unlike this video'>Liked</button></div>",
      "<like-button-view-model class='ytLikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><label class='yt-spec-button-shape-with-label'><button class='yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' aria-pressed='true' aria-label='26,959 likes' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'></div></button><div class='yt-spec-button-shape-with-label__label' aria-hidden='false'><span role='text'>26K</span></div></label></button-view-model></toggle-button-view-model></like-button-view-model>"
    ],
    ignores: [
      "<button>Other</button>",
      "<a href='/watch?v=123' id='video-title' title='Videos I like to rewatch'>Videos I like to rewatch</a>"
    ]
  }
};

describe("like directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("like", directiveTestCase.test);
  });
});