import { describe, expect, test } from "bun:test";
import { withHintModeModule } from "~/tests/helpers/hint-mode";

describe("hint mode", () => {
  test("avoids the toggle key as the first hint character", async () => {
    await withHintModeModule("", ({ generateHintLabels }) => {
      const labels = (generateHintLabels as (...args: unknown[]) => string[])(5, "abcd", 1, ["a"]);
      expect(labels.every((label) => !label.startsWith("a"))).toBe(true);
    });
  });
});