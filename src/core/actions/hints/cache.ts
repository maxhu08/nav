import type { LinkMode } from "~/src/core/utils/hints/model";
import type { HintLabelIndex, HintState } from "~/src/core/utils/hints/types";

export type HintActivationCache = {
  labelIndex: HintLabelIndex;
  markers: HintState["markers"];
  mode: LinkMode;
  overlay: HTMLDivElement;
  scrollX: number;
  scrollY: number;
  settingsKey: string;
  viewportHeight: number;
  viewportWidth: number;
};

export const createHintActivationCacheController = (deps: {
  getSettingsKey: (mode: LinkMode) => string;
}) => {
  let hintActivationCache: HintActivationCache | null = null;
  let hintCacheObserver: MutationObserver | null = null;
  let suspendedHintCacheMutationCount = 0;

  const invalidate = (): void => {
    hintActivationCache = null;
  };

  const ensureObserver = (): void => {
    if (hintCacheObserver || !document.documentElement) {
      return;
    }

    hintCacheObserver = new MutationObserver(() => {
      if (suspendedHintCacheMutationCount > 0) {
        return;
      }

      invalidate();
    });

    hintCacheObserver.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
  };

  const withoutInvalidation = <T>(callback: () => T): T => {
    suspendedHintCacheMutationCount += 1;

    try {
      return callback();
    } finally {
      queueMicrotask(() => {
        suspendedHintCacheMutationCount -= 1;
      });
    }
  };

  const getReusable = (mode: LinkMode): HintActivationCache | null => {
    const cache = hintActivationCache;
    if (!cache) {
      return null;
    }

    if (
      cache.mode !== mode ||
      cache.settingsKey !== deps.getSettingsKey(mode) ||
      cache.viewportWidth !== window.innerWidth ||
      cache.viewportHeight !== window.innerHeight ||
      cache.scrollX !== window.scrollX ||
      cache.scrollY !== window.scrollY
    ) {
      return null;
    }

    for (const hint of cache.markers) {
      if (!hint.element.isConnected) {
        return null;
      }
    }

    return cache;
  };

  const set = (cache: HintActivationCache): void => {
    hintActivationCache = cache;
  };

  return {
    ensureObserver,
    getReusable,
    invalidate,
    set,
    withoutInvalidation
  };
};