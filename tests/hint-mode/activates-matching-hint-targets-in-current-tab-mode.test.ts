import { describe, expect, test } from "bun:test";
import { withHintController } from "~/tests/helpers/hint-mode";

describe("hint mode", () => {
  test("activates matching hint targets in current tab mode", async () => {
    await withHintController(
      [
        "<a id='first' href='https://example.com/first'>first</a>",
        "<a id='second' href='https://example.com/second'>second</a>",
        "<button id='third'>third</button>"
      ],
      ({ controller, getMode }) => {
        controller.setHintCharset("ab");
        controller.setMinLabelLength(1);
        controller.setHintCss("");

        let clicks = 0;
        const secondLink = document.getElementById("second") as HTMLAnchorElement;
        secondLink.click = () => {
          clicks += 1;
        };

        expect(controller.activateMode("current-tab")).toBe(true);
        expect(getMode()).toBe("hint");

        controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "b" }));

        expect(clicks).toBe(1);
        expect(getMode()).toBe("normal");
        expect(document.getElementById("nav-hint-overlay")).toBeNull();
      }
    );
  });
});