import { remapSidebarDirectiveIndex } from "~/src/core/utils/hints/directive-recognition/home-sidebar";
import { remapAttachDirectiveIndex } from "~/src/core/utils/hints/directive-recognition/input-attach";
import type { PreferredDirectiveIndexes } from "~/src/core/utils/hints/directive-recognition/types";
import type { DirectiveFeatureResolver } from "~/src/core/utils/hints/directive-recognition/candidate-generation";

export const remapPreferredDirectiveIndexes = (
  elements: HTMLElement[],
  bestIndexes: PreferredDirectiveIndexes,
  getFeatures: DirectiveFeatureResolver
): PreferredDirectiveIndexes => {
  if (bestIndexes.attach !== undefined) {
    bestIndexes.attach = remapAttachDirectiveIndex(
      elements,
      bestIndexes.attach,
      (element) => getFeatures(element).rect
    );
  }

  if (bestIndexes.sidebar !== undefined) {
    bestIndexes.sidebar = remapSidebarDirectiveIndex(
      elements,
      bestIndexes.sidebar,
      (element) => getFeatures(element).rect
    );
  }

  return bestIndexes;
};