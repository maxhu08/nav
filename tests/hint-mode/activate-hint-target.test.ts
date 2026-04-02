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
      let focusIndicatorTarget: HTMLElement | null = null;

      window.addEventListener(FOCUS_INDICATOR_EVENT, ((event: Event) => {
        focusIndicatorTarget = (event as CustomEvent<{ element: HTMLElement }>).detail.element;
      }) as EventListener);

      for (const eventName of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
        trigger.addEventListener(eventName, () => {
          receivedEvents.push(eventName);
        });
      }

      expect(activateHintTarget("current-tab", createHintTarget(trigger))).toBe(true);
      expect(receivedEvents).toEqual(["pointerdown", "mousedown", "pointerup", "mouseup", "click"]);
      expect(focusIndicatorTarget === trigger).toBe(true);
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

  test("dispatches right click events for right click hint mode", async () => {
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
      let focusIndicatorTarget: HTMLElement | null = null;

      window.addEventListener(FOCUS_INDICATOR_EVENT, ((event: Event) => {
        focusIndicatorTarget = (event as CustomEvent<{ element: HTMLElement }>).detail.element;
      }) as EventListener);

      for (const eventName of ["pointerdown", "mousedown", "pointerup", "mouseup", "contextmenu"]) {
        trigger.addEventListener(eventName, () => {
          receivedEvents.push(eventName);
        });
      }

      expect(activateHintTarget("right-click", createHintTarget(trigger))).toBe(true);
      expect(receivedEvents).toEqual([
        "pointerdown",
        "mousedown",
        "pointerup",
        "mouseup",
        "contextmenu"
      ]);
      expect(focusIndicatorTarget === trigger).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test("clears erase directive targets and keeps focus", async () => {
    const fixture = createDomFixture("<textarea id='composer'>hello world</textarea>");

    try {
      const { activateHintTarget } =
        await import("~/src/core/utils/hint-mode/actions/activate-hint-target");

      const composer = document.getElementById("composer") as HTMLTextAreaElement;
      const receivedEvents: string[] = [];

      composer.addEventListener("input", () => {
        receivedEvents.push("input");
      });
      composer.addEventListener("change", () => {
        receivedEvents.push("change");
      });

      expect(
        activateHintTarget("current-tab", {
          ...createHintTarget(composer),
          directiveMatch: {
            directive: "erase",
            label: "er"
          }
        })
      ).toBe(true);
      expect(composer.value).toBe("");
      expect(document.activeElement).toBe(composer);
      expect(receivedEvents).toEqual(["input", "change"]);
    } finally {
      fixture.cleanup();
    }
  });

  test("dispatches the hide directive click outside the modal", async () => {
    const fixture = createDomFixture(`
      <div id='backdrop'>
        <div id='modal' class='rd-popup'></div>
      </div>
    `);

    try {
      const { activateHintTarget } =
        await import("~/src/core/utils/hint-mode/actions/activate-hint-target");

      const backdrop = document.getElementById("backdrop") as HTMLDivElement;
      const modal = document.getElementById("modal") as HTMLDivElement;
      const receivedEvents: string[] = [];
      const receivedPoints: Array<[number, number]> = [];

      modal.getBoundingClientRect = (): DOMRect => new DOMRect(100, 100, 400, 300);
      backdrop.getBoundingClientRect = (): DOMRect => new DOMRect(0, 0, 800, 600);
      document.elementsFromPoint = (x: number, y: number): Element[] => {
        if (x >= 100 && x <= 500 && y >= 100 && y <= 400) {
          return [modal];
        }

        return [backdrop];
      };

      for (const eventName of ["mousedown", "mouseup", "click"]) {
        backdrop.addEventListener(eventName, (event) => {
          const mouseEvent = event as MouseEvent;
          receivedEvents.push(eventName);
          receivedPoints.push([mouseEvent.clientX, mouseEvent.clientY]);
        });
      }

      expect(
        activateHintTarget("current-tab", {
          ...createHintTarget(modal),
          rect: new DOMRect(492, 108, 1, 1),
          directiveMatch: {
            directive: "hide",
            label: "hi"
          }
        })
      ).toBe(true);
      expect(receivedEvents).toEqual(["mousedown", "mouseup", "click"]);
      expect(
        receivedPoints.every(([x, y]) => !(x >= 100 && x <= 500 && y >= 100 && y <= 400))
      ).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });
});