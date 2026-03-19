import { describe, test } from "bun:test";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";
import type { HintScenarioCase } from "~/tests/types";

export const hintScenarioCases: HintScenarioCase[] = [
  {
    desc: "keeps like and dislike directives on nested YouTube reaction buttons inside view-model wrappers",
    test: {
      fixtures: [
        "<like-button-view-model class='ytLikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><label class='yt-spec-button-shape-with-label'><button id='pressed-like-button' class='yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' aria-pressed='true' aria-label='26,959 likes' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'></div></button><div class='yt-spec-button-shape-with-label__label' aria-hidden='false'><span role='text'>26K</span></div></label></button-view-model></toggle-button-view-model></like-button-view-model>",
        "<dislike-button-view-model class='ytDislikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><label class='yt-spec-button-shape-with-label'><button id='pressed-dislike-button' class='yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' aria-pressed='false' aria-label='Dislike this video' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'></div></button></label></button-view-model></toggle-button-view-model></dislike-button-view-model>"
      ],
      expect: {
        directiveTargets: {
          like: "#pressed-like-button",
          dislike: "#pressed-dislike-button"
        }
      }
    }
  },
  {
    desc: "dedupes a YouTube like label wrapper so only the inner reaction button keeps the hint",
    test: {
      fixtures: [
        "<toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><label id='wrapped-like-label' class='yt-spec-button-shape-with-label'><button id='wrapped-like-button' class='yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' title='' aria-pressed='false' aria-label='like this video along with 91 thousand other people' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'></div><yt-touch-feedback-shape aria-hidden='true' class='yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response yt-spec-touch-feedback-shape--down'><div class='yt-spec-touch-feedback-shape__stroke'></div><div class='yt-spec-touch-feedback-shape__fill'></div></yt-touch-feedback-shape></button><div class='yt-spec-button-shape-with-label__label' aria-hidden='false'><span role='text'>91K</span></div></label></button-view-model></toggle-button-view-model>"
      ],
      geometry: {
        "#wrapped-like-label": { left: 24, top: 24, width: 120, height: 40 },
        "#wrapped-like-button": { left: 24, top: 24, width: 40, height: 40 }
      },
      elementsFromPointSelectors: ["#wrapped-like-button"],
      reservedLabels: {
        like: ["li"]
      },
      expect: {
        hintableSelectors: ["#wrapped-like-button"],
        directiveTargets: {
          like: "#wrapped-like-button"
        },
        assignedTargets: [
          {
            selector: "#wrapped-like-button",
            directive: "like"
          }
        ]
      }
    }
  },
  {
    desc: "assigns both YouTube segmented reaction directives inside an outerHTML-heavy view-model host",
    test: {
      fixtures: [
        "<segmented-like-dislike-button-view-model button-renderer='true' class='ytSegmentedLikeDislikeButtonViewModelHost style-scope ytd-menu-renderer'><yt-smartimation class='smartimation smartimation--enable-masking'><div class='smartimation__content'><div class='ytSegmentedLikeDislikeButtonViewModelSegmentedButtonsWrapper'><like-button-view-model class='ytLikeButtonViewModelHost'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><button id='segmented-like-button' class='yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--segmented-start yt-spec-button-shape-next--enable-backdrop-filter-experiment' title='' aria-pressed='false' aria-label='like this video along with 14,843 other people' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'><yt-icon style='width: 24px; height: 24px;'><span class='yt-icon-shape style-scope yt-icon ytSpecIconShapeHost'><div style='width: 100%; height: 100%; display: block; fill: currentcolor;'><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true' style='pointer-events: none; display: inherit; width: 100%; height: 100%;'><path d='M9.221 1.795a1 1 0 011.109-.656l1.04.173a4 4 0 013.252 4.784L14 9h4.061a3.664 3.664 0 013.576 2.868A3.68 3.68 0 0121 14.85l.02.087A3.815 3.815 0 0120 18.5v.043l-.01.227a2.82 2.82 0 01-.135.663l-.106.282A3.754 3.754 0 0116.295 22h-3.606l-.392-.007a12.002 12.002 0 01-5.223-1.388l-.343-.189-.27-.154a2.005 2.005 0 00-.863-.26l-.13-.004H3.5a1.5 1.5 0 01-1.5-1.5V12.5A1.5 1.5 0 013.5 11h1.79l.157-.013a1 1 0 00.724-.512l.063-.145 2.987-8.535Zm-1.1 9.196A3 3 0 015.29 13H4v4.998h1.468a4 4 0 011.986.528l.27.155.285.157A10 10 0 0012.69 20h3.606c.754 0 1.424-.483 1.663-1.2l.03-.126a.819.819 0 00.012-.131v-.872l.587-.586c.388-.388.577-.927.523-1.465l-.038-.23-.02-.087-.21-.9.55-.744A1.663 1.663 0 0018.061 11H14a2.002 2.002 0 01-1.956-2.418l.623-2.904a2 2 0 00-1.626-2.392l-.21-.035-2.71 7.741Z'></path></svg></div></span></yt-icon></div><div class='yt-spec-button-shape-next__button-text-content'>14K</div><yt-touch-feedback-shape aria-hidden='true' class='yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response'><div class='yt-spec-touch-feedback-shape__stroke'></div><div class='yt-spec-touch-feedback-shape__fill'></div></yt-touch-feedback-shape></button></button-view-model></toggle-button-view-model></like-button-view-model><dislike-button-view-model class='ytDislikeButtonViewModelHost'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><button id='segmented-dislike-button' class='yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--segmented-end yt-spec-button-shape-next--enable-backdrop-filter-experiment' title='' aria-pressed='false' aria-label='Dislike this video' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'><span class='ytIconWrapperHost' style='width: 24px; height: 24px;'><span class='yt-icon-shape ytSpecIconShapeHost'><div style='width: 100%; height: 100%; display: block; fill: currentcolor;'><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true' style='pointer-events: none; display: inherit; width: 100%; height: 100%;'><path d='m11.31 2 .392.007c1.824.06 3.61.534 5.223 1.388l.343.189.27.154c.264.152.56.24.863.26l.13.004H20.5a1.5 1.5 0 011.5 1.5V11.5a1.5 1.5 0 01-1.5 1.5h-1.79l-.158.013a1 1 0 00-.723.512l-.064.145-2.987 8.535a1 1 0 01-1.109.656l-1.04-.174a4 4 0 01-3.251-4.783L10 15H5.938a3.664 3.664 0 01-3.576-2.868A3.682 3.682 0 013 9.15l-.02-.088A3.816 3.816 0 014 5.5v-.043l.008-.227a2.86 2.86 0 01.136-.664l.107-.28A3.754 3.754 0 017.705 2h3.605ZM7.705 4c-.755 0-1.425.483-1.663 1.2l-.032.126a.818.818 0 00-.01.131v.872l-.587.586a1.816 1.816 0 00-.524 1.465l.038.23.02.087.21.9-.55.744a1.686 1.686 0 00-.321 1.18l.029.177c.17.76.844 1.302 1.623 1.302H10a2.002 2.002 0 011.956 2.419l-.623 2.904-.034.208a2.002 2.002 0 001.454 2.139l.206.045.21.035 2.708-7.741A3.001 3.001 0 0118.71 11H20V6.002h-1.47c-.696 0-1.38-.183-1.985-.528l-.27-.155-.285-.157A10.002 10.002 0 0011.31 4H7.705Z'></path></svg></div></span></span></div><yt-touch-feedback-shape aria-hidden='true' class='yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response yt-spec-touch-feedback-shape--down'><div class='yt-spec-touch-feedback-shape__stroke'></div><div class='yt-spec-touch-feedback-shape__fill'></div></yt-touch-feedback-shape></button></button-view-model></toggle-button-view-model></dislike-button-view-model></div></div></yt-smartimation></segmented-like-dislike-button-view-model>"
      ],
      geometry: {
        "#segmented-like-button": { left: 24, top: 24, width: 120, height: 40 },
        "#segmented-dislike-button": { left: 148, top: 24, width: 40, height: 40 }
      },
      reservedLabels: {
        like: ["li"],
        dislike: ["di"]
      },
      expect: {
        hintableSelectors: ["#segmented-like-button", "#segmented-dislike-button"],
        directiveTargets: {
          like: "#segmented-like-button",
          dislike: "#segmented-dislike-button"
        },
        assignedTargets: [
          {
            selector: "#segmented-like-button",
            directive: "like"
          },
          {
            selector: "#segmented-dislike-button",
            directive: "dislike"
          }
        ]
      }
    }
  }
];

describe("youtube hint scenarios", () => {
  for (const hintScenarioCase of hintScenarioCases) {
    test(hintScenarioCase.desc, () => {
      runHintScenarioCase(hintScenarioCase.test);
    });
  }
});