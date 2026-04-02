import { describe, expect, test } from "bun:test";
import { withHintController } from "~/tests/helpers/hint-mode";

describe("hint mode", () => {
  test("allows the toggle key after the first hint character", async () => {
    await withHintController(
      [
        "<a id='first' href='https://example.com/first'>first</a>",
        "<a id='second' href='https://example.com/second'>second</a>",
        "<a id='third' href='https://example.com/third'>third</a>"
      ],
      ({ controller, getMode }) => {
        controller.setHintCharset("af");
        controller.setMinLabelLength(1);

        let clicks = 0;
        const thirdLink = document.getElementById("third") as HTMLAnchorElement;
        thirdLink.click = () => {
          clicks += 1;
        };

        expect(
          (
            controller.activateMode as (
              mode: string,
              options?: { toggleKey?: string | null }
            ) => boolean
          )("current-tab", { toggleKey: "f" })
        ).toBe(true);
        expect(getMode()).toBe("hint");

        controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "a" }));
        expect(getMode()).toBe("hint");

        controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "f" }));

        expect(clicks).toBe(1);
        expect(getMode()).toBe("normal");
      }
    );
  });
});