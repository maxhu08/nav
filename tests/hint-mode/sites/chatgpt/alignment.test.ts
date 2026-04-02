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

describe("ChatGPT site hint marker alignment", () => {
  test("keeps the matched composer markers on the same row", () => {
    const fixture = createDomFixture(readSiteFixture());

    try {
      setViewport(1200, 900);

      const plusButton = getRequiredElement<HTMLButtonElement>("#composer-plus-btn");
      const promptTextarea = getRequiredElement<HTMLElement>("#prompt-textarea");
      const dictationButton = getRequiredElement<HTMLButtonElement>(
        "button[aria-label='Start dictation']"
      );
      const voiceButton = getRequiredElement<HTMLButtonElement>("button[aria-label='Start Voice']");

      setRect(plusButton, 16, 10, 36, 36);
      setRect(promptTextarea, 72, 12, 720, 36);
      setRect(dictationButton, 820, 11, 36, 36);
      setRect(voiceButton, 872, 13, 36, 36);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const composerElements: HTMLElement[] = [
        plusButton,
        promptTextarea,
        dictationButton,
        voiceButton
      ];
      const composerTargets = targets.filter((target) => composerElements.includes(target.element));

      expect(new Set(composerTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["10px"])
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps the typed composer submit marker on the same row", () => {
    const fixture = createDomFixture(`
      <div class="composer-shell">
        <form class="group/composer" data-type="unified-composer">
          <div data-composer-surface="true">
            <div class="leading">
              <button
                type="button"
                class="composer-btn"
                data-testid="composer-plus-btn"
                aria-label="Add files and more"
                id="composer-plus-btn"
              ></button>
            </div>

            <div class="primary">
              <div
                contenteditable="true"
                translate="no"
                class="ProseMirror"
                id="prompt-textarea"
                role="textbox"
                aria-multiline="true"
                aria-label="Chat with ChatGPT"
              >
                <p>Hello</p>
              </div>
            </div>

            <div class="trailing">
              <button aria-label="Start dictation" type="button" class="composer-btn"></button>
              <button
                id="composer-submit-button"
                type="button"
                aria-label="Send prompt"
                data-testid="send-button"
                class="composer-submit-btn"
              ></button>
            </div>
          </div>
        </form>
      </div>
    `);

    try {
      setViewport(1200, 900);

      const plusButton = getRequiredElement<HTMLButtonElement>("#composer-plus-btn");
      const promptTextarea = getRequiredElement<HTMLElement>("#prompt-textarea");
      const dictationButton = getRequiredElement<HTMLButtonElement>(
        "button[aria-label='Start dictation']"
      );
      const submitButton = getRequiredElement<HTMLButtonElement>("#composer-submit-button");

      setRect(plusButton, 16, 10, 36, 36);
      setRect(promptTextarea, 72, 12, 720, 36);
      setRect(dictationButton, 820, 11, 36, 36);
      setRect(submitButton, 872, 13, 36, 36);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const composerElements: HTMLElement[] = [
        plusButton,
        promptTextarea,
        dictationButton,
        submitButton
      ];
      const composerTargets = targets.filter((target) => composerElements.includes(target.element));

      expect(new Set(composerTargets.map((target) => target.marker.style.top))).toEqual(
        new Set(["10px"])
      );
    } finally {
      fixture.cleanup();
    }
  });
});