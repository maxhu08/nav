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
});