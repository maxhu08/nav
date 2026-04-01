import { describe, expect, test } from "bun:test";
import { FOCUS_INDICATOR_EVENT } from "~/src/core/utils/get-ui";
import type { HintTarget } from "~/src/core/utils/hint-mode/shared/types";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const createHintTarget = (element: HTMLElement): HintTarget => ({
  element,
  imageUrl: null,
  label: "a",
  linkUrl: null,
  marker: document.createElement("div"),
  rect: element.getBoundingClientRect()
});

describe("activateHintTarget", () => {
  test("dispatches press events before click for popup triggers", async () => {
    const fixture = createDomFixture(
      "<button id='trigger' type='button' aria-haspopup='menu'>Open menu</button>"
    );

    try {
      const { activateHintTarget } =
        await import("~/src/core/utils/hint-mode/actions/activate-hint-target");

      Object.defineProperty(window, "PointerEvent", {
        configurable: true,
        value: window.MouseEvent
      });

      const trigger = document.getElementById("trigger") as HTMLButtonElement;
      const receivedEvents: string[] = [];

      for (const eventName of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
        trigger.addEventListener(eventName, () => {
          receivedEvents.push(eventName);
        });
      }

      expect(activateHintTarget("current-tab", createHintTarget(trigger))).toBe(true);
      expect(receivedEvents).toEqual(["pointerdown", "mousedown", "pointerup", "mouseup", "click"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("focuses editable targets before activation", async () => {
    const fixture = createDomFixture("<input id='field' />");

    try {
      const { activateHintTarget } =
        await import("~/src/core/utils/hint-mode/actions/activate-hint-target");

      const field = document.getElementById("field") as HTMLInputElement;
      let focusIndicatorTarget: HTMLElement | null = null;
      let didClick = false;

      window.addEventListener(FOCUS_INDICATOR_EVENT, ((event: Event) => {
        focusIndicatorTarget = (event as CustomEvent<{ element: HTMLElement }>).detail.element;
      }) as EventListener);

      field.click = () => {
        didClick = true;
      };

      expect(activateHintTarget("current-tab", createHintTarget(field))).toBe(true);
      expect(document.activeElement).toBe(field);
      expect(focusIndicatorTarget === field).toBe(true);
      expect(didClick).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });
});