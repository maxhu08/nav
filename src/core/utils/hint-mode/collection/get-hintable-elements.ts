import { CLICKABLE_SELECTOR, IMAGE_SELECTOR } from "~/src/core/utils/hint-mode/shared/constants";
import { collectElements } from "~/src/core/utils/hint-mode/collection/collect-elements";
import { isElementVisible } from "~/src/core/utils/hint-mode/collection/is-element-visible";
import type { HintActionMode } from "~/src/core/utils/hint-mode/shared/types";

export const getHintableElements = (mode: HintActionMode): HTMLElement[] => {
  const results: HTMLElement[] = [];
  const selector =
    mode === "yank-image" || mode === "yank-image-url" ? IMAGE_SELECTOR : CLICKABLE_SELECTOR;

  collectElements(document, selector, results);

  const seen = new Set<HTMLElement>();
  return results.filter((element) => {
    if (seen.has(element) || !isElementVisible(element)) {
      return false;
    }

    seen.add(element);
    return true;
  });
};