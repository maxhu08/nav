import { describe, expect, test } from "bun:test";
import {
  getHintableElements,
  getPreferredDirectiveIndexes
} from "~/src/core/utils/hints/hint-recognition";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

const applyRect = (element: HTMLElement, rect: DOMRect): void => {
  element.getBoundingClientRect = (): DOMRect => rect;
  element.getClientRects = (): DOMRectList => createRectList(rect);
};

describe("shadow DOM hint collection", () => {
  test("collects hintable buttons inside open shadow roots", () => {
    const fixture = createDomFixture("<div id='shadow-host'></div>");

    try {
      const host = document.getElementById("shadow-host");
      expect(host instanceof HTMLElement).toBe(true);
      if (!(host instanceof HTMLElement)) {
        return;
      }

      const shadowRoot = host.attachShadow({ mode: "open" });
      shadowRoot.innerHTML = "<button id='shadow-button' type='button'>Toggle</button>";

      const button = shadowRoot.getElementById("shadow-button");
      expect(button instanceof HTMLButtonElement).toBe(true);
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const rect = new DOMRect(20, 20, 40, 40);
      applyRect(host, rect);
      applyRect(button, rect);
      document.elementsFromPoint = () => [host];
      shadowRoot.elementsFromPoint = () => [button];

      expect(getHintableElements("current-tab")).toContain(button);
    } finally {
      fixture.cleanup();
    }
  });

  test("recognizes sidebar controls inside open shadow roots", () => {
    const fixture = createDomFixture("<div id='shadow-host'></div>");

    try {
      const host = document.getElementById("shadow-host");
      expect(host instanceof HTMLElement).toBe(true);
      if (!(host instanceof HTMLElement)) {
        return;
      }

      const shadowRoot = host.attachShadow({ mode: "open" });
      shadowRoot.innerHTML =
        "<button id='shadow-sidebar-button' type='button' aria-label='Collapse sidebar'>Collapse</button>";

      const button = shadowRoot.getElementById("shadow-sidebar-button");
      expect(button instanceof HTMLButtonElement).toBe(true);
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const rect = new DOMRect(20, 20, 40, 40);
      applyRect(host, rect);
      applyRect(button, rect);
      document.elementsFromPoint = () => [host];
      shadowRoot.elementsFromPoint = () => [button];

      const elements = getHintableElements("current-tab");
      const directives = getPreferredDirectiveIndexes(elements);

      expect(directives.sidebar).not.toBeUndefined();
      expect(elements[directives.sidebar as number]).toBe(button);
    } finally {
      fixture.cleanup();
    }
  });

  test("avoids recursive shadow hit-test loops when roots return their host", () => {
    const fixture = createDomFixture("<div id='shadow-host'></div>");

    try {
      const host = document.getElementById("shadow-host");
      expect(host instanceof HTMLElement).toBe(true);
      if (!(host instanceof HTMLElement)) {
        return;
      }

      const shadowRoot = host.attachShadow({ mode: "open" });
      shadowRoot.innerHTML = "<button id='shadow-button' type='button'>Toggle</button>";

      const button = shadowRoot.getElementById("shadow-button");
      expect(button instanceof HTMLButtonElement).toBe(true);
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const rect = new DOMRect(20, 20, 40, 40);
      applyRect(host, rect);
      applyRect(button, rect);
      document.elementsFromPoint = () => [host];
      shadowRoot.elementsFromPoint = () => [host];

      expect(() => getHintableElements("current-tab")).not.toThrow();
      expect(getHintableElements("current-tab")).toContain(button);
    } finally {
      fixture.cleanup();
    }
  });
});