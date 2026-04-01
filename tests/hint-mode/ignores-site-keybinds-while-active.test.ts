import { describe, expect, test } from "bun:test";
import { withHintController } from "~/tests/helpers/hint-mode";

describe("hint mode", () => {
  test("suppresses page key listeners while active", async () => {
    await withHintController(
      ["<a id='first' href='https://example.com/first'>first</a>"],
      ({ controller }) => {
        controller.setHintCharset("abc");

        const receivedKeys: string[] = [];
        document.addEventListener("keydown", (event) => {
          receivedKeys.push(event.key);
        });

        expect(controller.activateMode("current-tab")).toBe(true);

        document.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: "a" }));
        controller.exitHintMode();
        document.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: "b" }));

        expect(receivedKeys).toEqual(["b"]);
      }
    );
  });
});