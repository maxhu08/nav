import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { renderHintTargets } from "~/src/core/utils/hint-mode/rendering/render-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const readSiteFixture = (): string => {
  return readFileSync(new URL("./fixture.html", import.meta.url), "utf8");
};

const setViewport = (width: number, height: number): void => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height
  });
};

const setRect = (
  element: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number
): void => {
  const rect = new DOMRect(left, top, width, height);
  element.getBoundingClientRect = (): DOMRect => rect;
  element.getClientRects = (): DOMRectList => {
    const list = [rect] as unknown as DOMRectList & DOMRect[];
    list.item = (index: number): DOMRect | null => list[index] ?? null;
    return list;
  };
};

const setMarkerSize = (marker: HTMLDivElement): void => {
  Object.defineProperty(marker, "offsetWidth", {
    configurable: true,
    get: () => 48
  });
  Object.defineProperty(marker, "offsetHeight", {
    configurable: true,
    get: () => 20
  });
};

const getRequiredElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector(selector);
  expect(element).toBeInstanceOf(HTMLElement);
  return element as T;
};

describe("YouTube site hint marker alignment", () => {
  test("keeps the matched masthead rows aligned while allowing the search input hints to sit lower", () => {
    const fixture = createDomFixture(readSiteFixture());

    try {
      setViewport(1600, 900);

      const backButton = getRequiredElement<HTMLButtonElement>("#back-button > button");
      const guideButton = getRequiredElement<HTMLButtonElement>("#guide-button > button");
      const logoLink = getRequiredElement<HTMLAnchorElement>("#logo-link");
      const searchInput = getRequiredElement<HTMLInputElement>("#search-input");
      const searchSubmit = getRequiredElement<HTMLButtonElement>("#search-submit");
      const voiceSearch = getRequiredElement<HTMLButtonElement>("#voice-search");
      const createButton = getRequiredElement<HTMLButtonElement>("#create-button");
      const notificationsButton = getRequiredElement<HTMLButtonElement>("#notifications-button");
      const avatarButton = getRequiredElement<HTMLButtonElement>("#avatar-btn");

      setRect(backButton, 16, 10, 32, 32);
      setRect(guideButton, 88, 10, 32, 32);
      setRect(logoLink, 160, 10, 120, 32);
      setRect(searchInput, 520, 18, 480, 36);
      setRect(searchSubmit, 1008, 10, 48, 36);
      setRect(voiceSearch, 1080, 12, 32, 32);
      setRect(createButton, 1260, 10, 88, 32);
      setRect(notificationsButton, 1384, 13, 32, 32);
      setRect(avatarButton, 1448, 11, 32, 32);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const mastheadStartElements: HTMLElement[] = [backButton, guideButton, logoLink];
      const mastheadEndElements: HTMLElement[] = [notificationsButton, avatarButton];
      const mastheadStartTargets = targets.filter((target) =>
        mastheadStartElements.includes(target.element)
      );
      const mastheadEndTargets = targets.filter((target) =>
        mastheadEndElements.includes(target.element)
      );
      const searchInputTargets = targets.filter((target) => target.element === searchInput);

      expect(new Set(mastheadStartTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["10px"])
      );
      expect(new Set(mastheadEndTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["13px"])
      );
      expect(new Set(searchInputTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["18px"])
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps the masthead start row aligned when the home link contains media content", () => {
    const fixture = createDomFixture(`
      <div id="masthead-container">
        <ytd-masthead id="masthead">
          <div id="container">
            <div id="start">
              <yt-icon-button id="back-button">
                <button aria-label="Back" type="button"></button>
              </yt-icon-button>
              <yt-icon-button id="guide-button">
                <button aria-label="Guide" type="button"></button>
              </yt-icon-button>
              <ytd-topbar-logo-renderer id="logo" show-yoodle="">
                <a id="logo-link" href="/?promo=featured" aria-label="YouTube Home" title="Featured creator event">
                  <ytd-yoodle-renderer>
                    <video aria-hidden="true"></video>
                  </ytd-yoodle-renderer>
                </a>
              </ytd-topbar-logo-renderer>
            </div>

            <div id="center">
              <yt-searchbox role="search">
                <input id="search-input" type="text" name="search_query" placeholder="Search" aria-label="Search" />
                <button id="search-submit" aria-label="Search" type="button"></button>
              </yt-searchbox>
              <button id="voice-search" aria-label="Search with your voice" type="button"></button>
            </div>

            <div id="end">
              <button id="create-button" aria-label="Create" type="button">Create</button>
              <ytd-notification-topbar-button-renderer>
                <yt-icon-button id="icon">
                  <button id="notifications-button" aria-label="Notifications" type="button"></button>
                </yt-icon-button>
              </ytd-notification-topbar-button-renderer>
              <ytd-topbar-menu-button-renderer>
                <button id="avatar-btn" aria-label="Account menu" type="button"></button>
              </ytd-topbar-menu-button-renderer>
            </div>
          </div>
        </ytd-masthead>
      </div>
    `);

    try {
      setViewport(1600, 900);

      const backButton = getRequiredElement<HTMLButtonElement>("#back-button > button");
      const guideButton = getRequiredElement<HTMLButtonElement>("#guide-button > button");
      const logoLink = getRequiredElement<HTMLAnchorElement>("#logo-link");
      const searchInput = getRequiredElement<HTMLInputElement>("#search-input");
      const notificationsButton = getRequiredElement<HTMLButtonElement>("#notifications-button");
      const avatarButton = getRequiredElement<HTMLButtonElement>("#avatar-btn");

      setRect(backButton, 16, 10, 32, 32);
      setRect(guideButton, 88, 10, 32, 32);
      setRect(logoLink, 160, 14, 120, 32);
      setRect(searchInput, 520, 18, 480, 36);
      setRect(notificationsButton, 1384, 13, 32, 32);
      setRect(avatarButton, 1448, 11, 32, 32);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const mastheadStartElements: HTMLElement[] = [backButton, guideButton, logoLink];
      const mastheadEndElements: HTMLElement[] = [notificationsButton, avatarButton];
      const mastheadStartTargets = targets.filter((target) =>
        mastheadStartElements.includes(target.element)
      );
      const mastheadEndTargets = targets.filter((target) =>
        mastheadEndElements.includes(target.element)
      );
      const searchInputTargets = targets.filter((target) => target.element === searchInput);

      expect(new Set(mastheadStartTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["10px"])
      );
      expect(new Set(mastheadEndTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["13px"])
      );
      expect(new Set(searchInputTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["18px"])
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps fullscreen quick action markers on the same row", () => {
    const fixture = createDomFixture(`
      <div class="ytp-fullscreen-quick-actions" data-overlay-order="13">
        <button id="like-button" aria-label="Like"></button>
        <button id="dislike-button" aria-label="Dislike"></button>
        <button id="comments-button" aria-label="Comments"></button>
        <button id="share-button" aria-label="Share"></button>
        <button id="ask-button" aria-label="Ask"></button>
      </div>
    `);

    try {
      setViewport(1600, 900);

      const likeButton = getRequiredElement<HTMLButtonElement>("#like-button");
      const dislikeButton = getRequiredElement<HTMLButtonElement>("#dislike-button");
      const commentsButton = getRequiredElement<HTMLButtonElement>("#comments-button");
      const shareButton = getRequiredElement<HTMLButtonElement>("#share-button");
      const askButton = getRequiredElement<HTMLButtonElement>("#ask-button");

      setRect(likeButton, 1100, 200, 32, 32);
      setRect(dislikeButton, 1150, 204, 32, 32);
      setRect(commentsButton, 1200, 208, 32, 32);
      setRect(shareButton, 1250, 202, 32, 32);
      setRect(askButton, 1300, 206, 32, 32);

      const targets = buildHintTargets("current-tab", "asdfg", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const quickActionElements: HTMLElement[] = [
        likeButton,
        dislikeButton,
        commentsButton,
        shareButton,
        askButton
      ];
      const quickActionTargets = targets.filter((target) =>
        quickActionElements.includes(target.element)
      );

      expect(quickActionTargets).toHaveLength(quickActionElements.length);
      expect(new Set(quickActionTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["200px"])
      );
    } finally {
      fixture.cleanup();
    }
  });
});