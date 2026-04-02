import { JSDOM } from "jsdom";

type GlobalKey = keyof typeof globalThis;

type DomFixture = {
  cleanup: () => void;
  document: Document;
  root: HTMLElement;
};

const makeRectList = (rect: DOMRect): DOMRectList => {
  const list = [rect] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number): DOMRect | null => list[index] ?? null;
  return list;
};

const defineGlobal = (
  key: GlobalKey,
  value: unknown,
  previousDescriptors: Map<GlobalKey, PropertyDescriptor | undefined>
): void => {
  if (!previousDescriptors.has(key)) {
    previousDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }

  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value
  });
};

const installDomGlobals = (window: JSDOM["window"]): (() => void) => {
  const previousDescriptors = new Map<GlobalKey, PropertyDescriptor | undefined>();
  const domWindow = window as unknown as typeof globalThis;

  const entries: Array<[GlobalKey, unknown]> = [
    ["window", window],
    ["document", window.document],
    ["history", window.history],
    ["navigator", window.navigator],
    ["Node", domWindow.Node],
    ["NodeFilter", domWindow.NodeFilter],
    ["Element", domWindow.Element],
    ["HTMLElement", domWindow.HTMLElement],
    ["HTMLDivElement", domWindow.HTMLDivElement],
    ["HTMLSpanElement", domWindow.HTMLSpanElement],
    ["HTMLStyleElement", domWindow.HTMLStyleElement],
    ["HTMLInputElement", domWindow.HTMLInputElement],
    ["HTMLTextAreaElement", domWindow.HTMLTextAreaElement],
    ["HTMLButtonElement", domWindow.HTMLButtonElement],
    ["HTMLImageElement", domWindow.HTMLImageElement],
    ["HTMLSelectElement", domWindow.HTMLSelectElement],
    ["HTMLVideoElement", domWindow.HTMLVideoElement],
    ["HTMLAnchorElement", domWindow.HTMLAnchorElement],
    ["HTMLAreaElement", domWindow.HTMLAreaElement],
    ["HTMLLabelElement", domWindow.HTMLLabelElement],
    ["ShadowRoot", domWindow.ShadowRoot],
    ["SVGElement", domWindow.SVGElement],
    ["CustomEvent", domWindow.CustomEvent],
    ["MutationObserver", domWindow.MutationObserver],
    ["DOMRect", domWindow.DOMRect],
    ["getComputedStyle", window.getComputedStyle.bind(window)]
  ];

  for (const [key, value] of entries) {
    defineGlobal(key, value, previousDescriptors);
  }

  return () => {
    for (const [key, descriptor] of previousDescriptors.entries()) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    }
  };
};

const installGeometryStubs = (root: HTMLElement): void => {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  elements.forEach((element, index) => {
    const rect = new DOMRect(0, index * 40, 160, 30);

    element.getBoundingClientRect = (): DOMRect => rect;
    element.getClientRects = (): DOMRectList => makeRectList(rect);
  });

  document.elementsFromPoint = (x: number, y: number): Element[] => {
    const matches = elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });

    return matches.length > 0 ? [matches[matches.length - 1] as Element] : [];
  };
};

export const createDomFixture = (outerHTML: string | string[]): DomFixture => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://example.com/"
  });
  const cleanupGlobals = installDomGlobals(dom.window);

  const root = document.createElement("div");
  root.id = "test-root";
  root.innerHTML = Array.isArray(outerHTML) ? outerHTML.join("\n") : outerHTML;
  document.body.innerHTML = "";
  document.body.append(root);

  installGeometryStubs(root);

  return {
    document,
    root,
    cleanup: () => {
      cleanupGlobals();
      dom.window.close();
    }
  };
};

export const getFixtureElements = (root: HTMLElement): HTMLElement[] => {
  return Array.from(root.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );
};