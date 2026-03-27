import { describe, expect, test } from "bun:test";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

describe("hint mode", () => {
  test("matches the expected alphabet hint ordering", async () => {
    const fixture = createDomFixture("");

    try {
      const { generateHintLabels } = await import("~/src/core/actions/hint-mode");
      expect(generateHintLabels(3, "ab", 1)).toEqual(["aa", "b", "ab"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("avoids the toggle key as the first hint character", async () => {
    const fixture = createDomFixture("");

    try {
      const { generateHintLabels } = await import("~/src/core/actions/hint-mode");
      const labels = (generateHintLabels as (...args: unknown[]) => string[])(5, "abcd", 1, ["a"]);
      expect(labels.every((label) => !label.startsWith("a"))).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test("activates matching hint targets in current tab mode", async () => {
    const fixture = createDomFixture([
      "<a id='first' href='https://example.com/first'>first</a>",
      "<a id='second' href='https://example.com/second'>second</a>",
      "<button id='third'>third</button>"
    ]);

    try {
      const { createHintController } = await import("~/src/core/actions/hint-mode");
      let mode: "normal" | "hint" = "normal";
      const controller = createHintController({
        setMode: (nextMode): void => {
          mode = nextMode === "watch" || nextMode === "find" ? "normal" : nextMode;
        }
      });

      controller.setHintCharset("ab");
      controller.setMinLabelLength(1);
      controller.setHintCss("");

      let clicks = 0;
      const secondLink = document.getElementById("second") as HTMLAnchorElement;
      secondLink.click = () => {
        clicks += 1;
      };

      expect(controller.activateMode("current-tab")).toBe(true);
      expect(String(mode)).toBe("hint");

      controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "b" }));

      expect(clicks).toBe(1);
      expect(String(mode)).toBe("normal");
      expect(document.getElementById("nav-hint-overlay")).toBeNull();
    } finally {
      fixture.cleanup();
    }
  });

  test("toggle key exits hint mode", async () => {
    const fixture = createDomFixture(["<a id='first' href='https://example.com/first'>first</a>"]);

    try {
      const { createHintController } = await import("~/src/core/actions/hint-mode");
      let mode: "normal" | "hint" = "normal";
      const controller = createHintController({
        setMode: (nextMode): void => {
          mode = nextMode === "watch" || nextMode === "find" ? "normal" : nextMode;
        }
      });

      controller.setHintCharset("abc");
      expect(
        (
          controller.activateMode as (
            mode: string,
            options?: { toggleKey?: string | null }
          ) => boolean
        )("current-tab", { toggleKey: "f" })
      ).toBe(true);
      expect(String(mode)).toBe("hint");

      controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "f" }));

      expect(String(mode)).toBe("normal");
    } finally {
      fixture.cleanup();
    }
  });
});