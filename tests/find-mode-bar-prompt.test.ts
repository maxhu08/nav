import { describe, expect, test } from "bun:test";
import { getFindBar, getFindInput } from "~/src/core/utils/get-ui";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createController = async () => {
  const { createFindModeController } = await import("~/src/core/actions/find-mode");
  let mode: "normal" | "find" | "hint" | "watch" = "normal";

  return createFindModeController({
    getMode: () => mode,
    setMode: (nextMode): void => {
      mode = nextMode;
    },
    onFocusIndicator: () => {},
    injectFindUIStyles: () => {}
  });
};

describe("find mode bar prompt", () => {
  test("shows mode-specific icons and placeholders for bar actions", async () => {
    const fixture = createDomFixture("");
    const previousCss = globalThis.CSS;

    try {
      Object.defineProperty(globalThis, "CSS", {
        configurable: true,
        writable: true,
        value: {}
      });

      const controller = await createController();

      expect(controller.openBarPrompt("current-tab")).toBe(true);
      expect(getFindBar()?.getAttribute("data-prompt-kind")).toBe("current-tab");
      expect(getFindInput()?.placeholder).toBe("open url or search...");

      expect(controller.openBarPrompt("new-tab")).toBe(true);
      expect(getFindBar()?.getAttribute("data-prompt-kind")).toBe("new-tab");
      expect(getFindInput()?.placeholder).toBe("open url or search (new tab)...");

      expect(controller.openBarPrompt("edit-current-tab", "https://example.com/path")).toBe(true);
      expect(getFindBar()?.getAttribute("data-prompt-kind")).toBe("edit-current-tab");
      expect(getFindInput()?.placeholder).toBe("edit current url or search...");
      expect(getFindInput()?.value).toBe("https://example.com/path");
    } finally {
      Object.defineProperty(globalThis, "CSS", {
        configurable: true,
        writable: true,
        value: previousCss
      });
      fixture.cleanup();
    }
  });
});