import { describe, expect, test } from "bun:test";
import { withHintController } from "~/tests/helpers/hint-mode";

describe("hint mode", () => {
  test("toggle key exits hint mode", async () => {
    await withHintController(
      ["<a id='first' href='https://example.com/first'>first</a>"],
      ({ controller, getMode }) => {
        controller.setHintCharset("abc");
        expect(
          (
            controller.activateMode as (
              mode: string,
              options?: { toggleKey?: string | null }
            ) => boolean
          )("current-tab", { toggleKey: "f" })
        ).toBe(true);
        expect(getMode()).toBe("hint");

        controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "f" }));

        expect(getMode()).toBe("normal");
      }
    );
  });
});