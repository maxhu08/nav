import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { createFindModeController } from "~/src/core/actions/find-mode";
import {
  FIND_CURRENT_HIGHLIGHT_NAME,
  FIND_HIGHLIGHT_NAME,
  getFindMatchCount,
  getFindStatusText
} from "~/src/core/utils/get-ui";
import { resetSiteKeybindIgnoreForTests } from "~/src/core/utils/ignore-site-keybinds";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

class TestHighlight extends Set<Range> {
  constructor(...ranges: Range[]) {
    super(ranges);
  }
}

let fixture: ReturnType<typeof createDomFixture>;
let controller: ReturnType<typeof createFindModeController>;
let descriptors: Map<string, PropertyDescriptor | undefined>;
let highlights: Map<string, TestHighlight>;
let styles: ReturnType<typeof spyOn<typeof window, "getComputedStyle">>;

beforeEach(async () => {
  fixture = createDomFixture(`
    <p id="matches">alpha <span>alpha</span> ALPHA alpha</p>
    <p id="other">unrelated text</p>
    <p style="visibility:hidden">alpha</p>
    <p style="opacity:0">alpha</p>
    <div contenteditable="true">alpha</div>
    <textarea>alpha</textarea>
    <script>alpha</script>
    <p id="unrendered">alpha</p>
  `);
  highlights = new Map();
  const globals = {
    CSS: { highlights },
    Highlight: TestHighlight,
    Text: window.Text,
    Range: window.Range,
    getSelection: window.getSelection.bind(window)
  };
  descriptors = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  Range.prototype.getClientRects = function () {
    return (this.startContainer.parentElement?.id === "unrendered"
      ? []
      : [new DOMRect(0, 0, 100, 20)]) as unknown as DOMRectList;
  };
  styles = spyOn(window, "getComputedStyle");
  let mode: "normal" | "find" | "hint" | "watch" = "normal";
  const module = await import("~/src/core/actions/find-mode");
  controller = module.createFindModeController({
    getMode: () => mode,
    setMode: (value) => {
      mode = value;
    },
    onFocusIndicator: () => {},
    injectFindUIStyles: () => {}
  });
  controller.openFindPrompt();
});

afterEach(() => {
  controller.exitFindMode();
  styles.mockRestore();
  resetSiteKeybindIgnoreForTests();
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  fixture.cleanup();
});

describe("find matching", () => {
  test("preserves smart-case matching and excludes hidden, editable, and unrendered text", () => {
    controller.setFindQuery("alpha");
    expect(getFindMatchCount()?.textContent).toBe("4 Matches");
    expect(Array.from(highlights.get(FIND_HIGHLIGHT_NAME)!, (range) => range.toString())).toEqual([
      "alpha",
      "alpha",
      "ALPHA",
      "alpha"
    ]);
    controller.setFindQuery("ALPHA");
    expect(getFindMatchCount()?.textContent).toBe("1 Matches");
    controller.setFindQuery("missing");
    expect(getFindMatchCount()?.textContent).toBe("0 Matches");
    expect(highlights.size).toBe(0);
  });

  test("checks styles only for matching parents and reuses eligibility within one scan", () => {
    controller.setFindQuery("alpha");
    expect(styles.mock.calls.filter((call) => call[0].id === "matches")).toHaveLength(1);
    expect(styles.mock.calls.filter((call) => call[0].id === "other")).toHaveLength(0);

    document.getElementById("matches")!.style.visibility = "hidden";
    controller.setFindQuery("alpha");
    expect(getFindMatchCount()?.textContent).toBe("0 Matches");
  });

  test("cycles only the current highlight while retaining all matches and wraparound", () => {
    const element = document.getElementById("matches")!;
    element.scrollIntoView = () => {};
    element.querySelector("span")!.scrollIntoView = () => {};
    controller.setFindQuery("alpha");
    const all = highlights.get(FIND_HIGHLIGHT_NAME)!;
    const first = highlights.get(FIND_CURRENT_HIGHLIGHT_NAME)!;
    expect(controller.cycleFindMatch(1)).toBe(true);
    expect(highlights.get(FIND_HIGHLIGHT_NAME) === all).toBe(true);
    expect(highlights.get(FIND_CURRENT_HIGHLIGHT_NAME)).not.toBe(first);
    expect(
      Array.from(highlights.get(FIND_CURRENT_HIGHLIGHT_NAME)!)[0]!.startContainer.parentElement
    ).toBe(element.querySelector("span"));
    expect(getFindStatusText()?.textContent).toBe("2\u00a0/\u00a04");
    expect(controller.cycleFindMatch(-1)).toBe(true);
    expect(controller.cycleFindMatch(-1)).toBe(true);
    expect(getFindStatusText()?.textContent).toBe("4\u00a0/\u00a04");
    expect(highlights.get(FIND_HIGHLIGHT_NAME) === all).toBe(true);

    controller.setFindQuery("");
    expect(highlights.size).toBe(0);
    expect(controller.cycleFindMatch(1)).toBe(false);
  });
});