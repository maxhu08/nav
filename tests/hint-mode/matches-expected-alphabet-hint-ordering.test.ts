import { describe, expect, test } from "bun:test";
import { withHintModeModule } from "~/tests/helpers/hint-mode";

describe("hint mode", () => {
  test("matches the expected alphabet hint ordering", async () => {
    await withHintModeModule("", ({ generateHintLabels }) => {
      expect(generateHintLabels(3, "ab", 1)).toEqual(["aa", "b", "ab"]);
    });
  });
});