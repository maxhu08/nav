import { describe, expect, test } from "bun:test";
import {
  getHintableElements,
  getPreferredDirectiveIndexes
} from "~/src/core/utils/hints/hint-recognition";
import { assignHintLabels } from "~/src/core/utils/hints/pipeline";
import { createEmptyReservedHintLabels } from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

const SHORTS_FIXTURE = `
  <div id="actions" class="style-scope ytd-reel-player-overlay-renderer">
    <div id="button-bar" class="style-scope ytd-reel-player-overlay-renderer">
      <reel-action-bar-view-model class="ytwReelActionBarViewModelHost ytwReelActionBarViewModelHostDesktop">
        <like-button-view-model class="ytLikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton">
          <toggle-button-view-model>
            <button-view-model class="ytSpecButtonViewModelHost">
              <label class="yt-spec-button-shape-with-label">
                <button id="shorts-like" class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-pressed="false" aria-label="Like this video along with 10 thousand other people" aria-disabled="false"></button>
                <div class="yt-spec-button-shape-with-label__label" aria-hidden="false"><span role="text">10K</span></div>
              </label>
            </button-view-model>
          </toggle-button-view-model>
        </like-button-view-model>
        <dislike-button-view-model class="ytDislikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton">
          <toggle-button-view-model>
            <button-view-model class="ytSpecButtonViewModelHost">
              <label class="yt-spec-button-shape-with-label">
                <button id="shorts-dislike" class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-pressed="false" aria-label="Dislike this video" aria-disabled="false"></button>
                <div class="yt-spec-button-shape-with-label__label" aria-hidden="false"><span role="text">Dislike</span></div>
              </label>
            </button-view-model>
          </toggle-button-view-model>
        </dislike-button-view-model>
        <button-view-model class="ytSpecButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton">
          <label class="yt-spec-button-shape-with-label">
            <button id="shorts-comments" class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-label="View 150 comments" aria-disabled="false"></button>
            <div class="yt-spec-button-shape-with-label__label" aria-hidden="false"><span role="text">150</span></div>
          </label>
        </button-view-model>
        <button-view-model class="ytSpecButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton">
          <label class="yt-spec-button-shape-with-label">
            <button id="shorts-share" class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-label="Share" aria-disabled="false"></button>
            <div class="yt-spec-button-shape-with-label__label" aria-hidden="false"><span role="text">Share</span></div>
          </label>
        </button-view-model>
        <button-view-model class="ytSpecButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton">
          <label class="yt-spec-button-shape-with-label">
            <button id="shorts-remix" class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-label="Remix this Short along with 1.6 thousand other remixes" aria-disabled="false"></button>
            <div class="yt-spec-button-shape-with-label__label" aria-hidden="false"><span role="text">1.6K</span></div>
          </label>
        </button-view-model>
      </reel-action-bar-view-model>
    </div>
    <div id="pivot-button" class="button-container style-scope ytd-reel-player-overlay-renderer" tabindex="0">
      <pivot-button-view-model class="ytwPivotButtonViewModelHost ytd-reel-player-overlay-renderer">
        <a id="shorts-sound" href="/sound/example" aria-haspopup="false" role="button" aria-label="See more videos using this sound">
          <img alt="" src="https://example.com/placeholder-sound.png" />
        </a>
      </pivot-button-view-model>
    </div>
  </div>
  <div class="navigation-container style-scope ytd-shorts">
    <div class="navigation-button style-scope ytd-shorts" id="navigation-button-up">
      <ytd-button-renderer button-tooltip-position="left" class="style-scope ytd-shorts" button-renderer="" button-next="">
        <yt-button-shape>
          <button id="shorts-prev" class="yt-spec-button-shape-next yt-spec-button-shape-next--text yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-xl yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-label="Previous video"></button>
        </yt-button-shape>
      </ytd-button-renderer>
    </div>
    <div class="navigation-button style-scope ytd-shorts" id="navigation-button-down">
      <ytd-button-renderer button-tooltip-position="left" class="style-scope ytd-shorts" button-renderer="" button-next="">
        <yt-button-shape>
          <button id="shorts-next" class="yt-spec-button-shape-next yt-spec-button-shape-next--text yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-xl yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-label="Next video"></button>
        </yt-button-shape>
      </ytd-button-renderer>
    </div>
  </div>
`;

const applyShortsGeometry = (): void => {
  const rects = new Map<string, DOMRect>([
    ["#shorts-like", new DOMRect(920, 140, 48, 48)],
    ["#shorts-dislike", new DOMRect(920, 220, 48, 48)],
    ["#shorts-comments", new DOMRect(920, 300, 48, 48)],
    ["#shorts-share", new DOMRect(920, 380, 48, 48)],
    ["#shorts-remix", new DOMRect(920, 460, 48, 48)],
    ["#shorts-sound", new DOMRect(880, 560, 56, 56)],
    ["#shorts-prev", new DOMRect(96, 240, 48, 48)],
    ["#shorts-next", new DOMRect(96, 340, 48, 48)]
  ]);

  for (const [selector, rect] of rects.entries()) {
    const element = document.querySelector(selector);
    expect(element instanceof HTMLElement).toBe(true);
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    element.getBoundingClientRect = (): DOMRect => rect;
    element.getClientRects = (): DOMRectList => createRectList(rect);
  }

  document.elementsFromPoint = (x: number, y: number): Element[] => {
    return Array.from(rects.entries())
      .filter(([, rect]) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
      .map(([selector]) => document.querySelector(selector))
      .filter((element): element is Element => element instanceof Element);
  };
};

describe("YouTube Shorts hints", () => {
  test("keeps action bar buttons and the sound pivot hintable", () => {
    const fixture = createDomFixture(SHORTS_FIXTURE);

    try {
      applyShortsGeometry();

      const elements = getHintableElements("current-tab");
      expect(elements.map((element) => element.id)).toEqual([
        "shorts-like",
        "shorts-dislike",
        "shorts-prev",
        "shorts-comments",
        "shorts-next",
        "shorts-share",
        "shorts-remix",
        "shorts-sound"
      ]);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps Shorts buttons hintable when an overlay ancestor has pointer-events none", () => {
    const fixture = createDomFixture(SHORTS_FIXTURE);

    try {
      applyShortsGeometry();

      const actions = document.querySelector("#actions");
      expect(actions instanceof HTMLElement).toBe(true);
      if (!(actions instanceof HTMLElement)) {
        return;
      }

      actions.style.pointerEvents = "none";

      for (const selector of [
        "#shorts-like",
        "#shorts-dislike",
        "#shorts-comments",
        "#shorts-share",
        "#shorts-remix",
        "#shorts-sound"
      ]) {
        const element = document.querySelector(selector);
        expect(element instanceof HTMLElement).toBe(true);
        if (!(element instanceof HTMLElement)) {
          continue;
        }

        element.style.pointerEvents = "auto";
      }

      expect(getHintableElements("current-tab").map((element) => element.id)).toContain(
        "shorts-comments"
      );
      expect(getHintableElements("current-tab").map((element) => element.id)).toContain(
        "shorts-share"
      );
      expect(getHintableElements("current-tab").map((element) => element.id)).toContain(
        "shorts-remix"
      );
      expect(getHintableElements("current-tab").map((element) => element.id)).toContain(
        "shorts-sound"
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("assigns prev and next reserved labels to Shorts navigation buttons", () => {
    const fixture = createDomFixture(SHORTS_FIXTURE);

    try {
      applyShortsGeometry();

      const elements = getHintableElements("current-tab");
      const directives = getPreferredDirectiveIndexes(elements);

      expect(elements[directives.prev as number]?.id).toBe("shorts-prev");
      expect(elements[directives.next as number]?.id).toBe("shorts-next");
      expect(elements[directives.sidebar as number]?.id).not.toBe("shorts-prev");

      const reservedLabels = createEmptyReservedHintLabels();
      reservedLabels.prev = ["lk"];
      reservedLabels.next = ["kl"];

      const targets = assignHintLabels(elements, reservedLabels, {
        minHintLabelLength: 2,
        hintAlphabet: "sadfjklewcmupgh",
        reservedHintPrefixes: new Set(),
        avoidedAdjacentHintPairs: {}
      });

      expect(targets.find((target) => target.element.id === "shorts-prev")?.directive).toBe("prev");
      expect(targets.find((target) => target.element.id === "shorts-prev")?.label).toBe("lk");
      expect(targets.find((target) => target.element.id === "shorts-next")?.directive).toBe("next");
      expect(targets.find((target) => target.element.id === "shorts-next")?.label).toBe("kl");
    } finally {
      fixture.cleanup();
    }
  });
});