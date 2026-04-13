import {
  activateClipboardImageTarget,
  activateClipboardTextTarget
} from "~/src/core/utils/hint-mode/actions/activation-helpers/activate-clipboard-target";
import { activateDefaultTarget } from "~/src/core/utils/hint-mode/actions/activation-helpers/activate-default-target";
import { clearDirectiveTarget } from "~/src/core/utils/hint-mode/actions/activation-helpers/clear-directive-target";
import { dispatchFocusIndicator } from "~/src/core/utils/hint-mode/actions/activation-helpers/dispatch-focus-indicator";
import { dispatchSyntheticRightClickEvents } from "~/src/core/utils/hint-mode/actions/activation-helpers/dispatch-synthetic-events";
import { hideDirectiveTarget } from "~/src/core/utils/hint-mode/actions/activation-helpers/hide-directive-target";
import type { HintActionMode, HintTarget } from "~/src/core/utils/hint-mode/shared/types";
type HintTargetHandler = (target: HintTarget) => boolean;

const directiveHandlers: Record<"erase" | "hide", HintTargetHandler> = {
  erase: (target) => clearDirectiveTarget(target.element),
  hide: (target) => hideDirectiveTarget(target.element)
};

const modeHandlers: Record<HintActionMode, HintTargetHandler> = {
  "current-tab": (target) => activateDefaultTarget(target),
  "new-tab": (target) => {
    if (!target.linkUrl) {
      return false;
    }

    dispatchFocusIndicator(target.element);
    window.open(target.linkUrl, "_blank", "noopener,noreferrer");
    return true;
  },
  "right-click": (target) => {
    dispatchFocusIndicator(target.element);
    dispatchSyntheticRightClickEvents(target.element);
    return true;
  },
  "yank-link-url": (target) =>
    activateClipboardTextTarget(
      target.linkUrl,
      "Link URL yanked",
      "Could not yank link URL",
      "Clipboard access was denied."
    ),
  "yank-image": (target) => activateClipboardImageTarget(target.imageUrl),
  "yank-image-url": (target) =>
    activateClipboardTextTarget(
      target.imageUrl,
      "Image URL yanked",
      "Could not yank image URL",
      "Clipboard access was denied."
    )
};

export const activateHintTarget = (mode: HintActionMode, target: HintTarget): boolean => {
  const directive = target.directiveMatch?.directive;
  if (directive === "erase" || directive === "hide") {
    return directiveHandlers[directive](target);
  }

  return modeHandlers[mode](target);
};