import { describe, expect, test } from "bun:test";
import { withHintController } from "~/tests/helpers/hint-mode";
import { parseReservedHintDirectives } from "~/src/utils/hint-reserved-label-directives";

describe("hint mode directive labels", () => {
  test("accepts directive label characters outside the hint charset", async () => {
    await withHintController(
      ["<textarea id='composer' placeholder='Message the assistant'></textarea>"],
      ({ controller, getMode }) => {
        controller.setHintCharset("ab");
        controller.setDirectiveLabels(parseReservedHintDirectives("@input kj\n@erase er"));

        const composer = document.getElementById("composer") as HTMLTextAreaElement;
        composer.value = "hello";

        expect(controller.activateMode("current-tab")).toBe(true);
        expect(getMode()).toBe("hint");

        controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "e" }));
        controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "r" }));

        expect(composer.value).toBe("");
        expect(getMode()).toBe("normal");
      }
    );
  });
});