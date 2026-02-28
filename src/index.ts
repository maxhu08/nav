import { installScrollTracking, scrollDown, scrollUp } from "~/src/actions/scroll";
import { isEditableTarget } from "~/src/utils/isEditableTarget";

type ActionName = "scroll-down" | "scroll-up";

type ActionHandler = () => boolean;

const KEY_ACTIONS: Partial<Record<string, ActionName>> = {
  j: "scroll-down",
  k: "scroll-up"
};

const ACTIONS: Record<ActionName, ActionHandler> = {
  "scroll-down": scrollDown,
  "scroll-up": scrollUp
};

installScrollTracking();

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    const actionName = KEY_ACTIONS[event.key];

    if (!actionName) {
      return;
    }

    const didHandle = ACTIONS[actionName]();

    if (!didHandle) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  },
  true
);
