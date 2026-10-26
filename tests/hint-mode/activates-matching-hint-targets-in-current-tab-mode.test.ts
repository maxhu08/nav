import { describe, expect, test } from "bun:test";
import { parseReservedHintDirectives } from "~/src/utils/hint-reserved-label-directives";
import { withHintController } from "~/tests/helpers/hint-mode";

describe("hint mode", () => {
  test.each(["kj", "er"])("completes the %s hint on an email input", async (label) => {
    await withHintController(
      "<input id='email-input' type='email' placeholder='Enter your email' value='user@example.com' />",
      ({ controller, getMode }) => {
        controller.setDirectiveLabels(parseReservedHintDirectives("@input kj\n@erase er"));
        controller.setMinLabelLength(2);

        const field = document.getElementById("email-input") as HTMLInputElement;

        expect(controller.activateMode("current-tab")).toBe(true);
        expect(getMode()).toBe("hint");
        expect(
          controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: label[0] }))
        ).toBe(true);
        expect(document.activeElement === field).toBe(false);
        expect(getMode()).toBe("hint");

        expect(
          controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: label[1] }))
        ).toBe(true);
        expect(document.activeElement === field).toBe(true);
        expect(field.value).toBe(label === "er" ? "" : "user@example.com");
        expect(controller.isHintModeActive()).toBe(false);
        expect(getMode()).toBe("normal");
        expect(document.getElementById("nav-hint-overlay")).toBeNull();
      }
    );
  });

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