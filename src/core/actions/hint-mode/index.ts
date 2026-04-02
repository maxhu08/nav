import { showHintToastError } from "~/src/core/utils/hint-mode/actions/show-hint-toast-error";
import { activateHintTarget } from "~/src/core/utils/hint-mode/actions/activate-hint-target";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { clampMinLabelLength } from "~/src/core/utils/hint-mode/generation/clamp-min-label-length";
import { generateHintLabels } from "~/src/core/utils/hint-mode/generation/generate-hint-labels";
import { normalizeHintCharset } from "~/src/core/utils/hint-mode/generation/normalize-hint-charset";
import { renderHintTargets } from "~/src/core/utils/hint-mode/rendering/render-hint-targets";
import { syncHintStyles } from "~/src/core/utils/hint-mode/rendering/sync-hint-styles";
import { updateVisibleTargets } from "~/src/core/utils/hint-mode/rendering/update-visible-targets";
import {
  activateSiteKeybindIgnore,
  deactivateSiteKeybindIgnore
} from "~/src/core/utils/ignore-site-keybinds";
import {
  DEFAULT_HINT_CHARSET,
  HINT_CONTAINER_ID
} from "~/src/core/utils/hint-mode/shared/constants";
import type {
  HintActionMode,
  HintDirectiveLabelMap,
  HintTarget
} from "~/src/core/utils/hint-mode/shared/types";
import { createEmptyReservedHintLabels } from "~/src/utils/hint-reserved-label-directives";

type HintControllerDeps = {
  setMode: (mode: "find" | "hint" | "normal" | "watch") => void;
};

export { generateHintLabels };

export const createHintController = ({ setMode }: HintControllerDeps) => {
  let activeMode: HintActionMode | null = null;
  let hintTargets: HintTarget[] = [];
  let typedPrefix = "";
  let toggleKey: string | null = null;
  let showCapitalizedLetters = false;
  let hintCharset = DEFAULT_HINT_CHARSET;
  let minLabelLength = 1;
  let hintCss = "";
  let improveThumbnailMarkers = false;
  let avoidAdjacentPairs: Partial<Record<string, Partial<Record<string, true>>>> = {};
  let directiveLabels: HintDirectiveLabelMap = createEmptyReservedHintLabels();

  const rebuildHintTargets = (mode: HintActionMode): HintTarget[] => {
    return buildHintTargets(
      mode,
      hintCharset,
      minLabelLength,
      showCapitalizedLetters,
      directiveLabels,
      toggleKey ? [toggleKey] : [],
      avoidAdjacentPairs,
      improveThumbnailMarkers
    );
  };

  const exitHintMode = (): void => {
    activeMode = null;
    typedPrefix = "";
    toggleKey = null;
    hintTargets = [];
    deactivateSiteKeybindIgnore("hints");
    setMode("normal");
    const container = document.getElementById(HINT_CONTAINER_ID);
    if (container instanceof HTMLDivElement) {
      container.remove();
    }
  };

  return {
    activateMode: (mode: HintActionMode, options?: { toggleKey?: string | null }): boolean => {
      exitHintMode();
      syncHintStyles(hintCss);
      toggleKey = options?.toggleKey?.toLowerCase() ?? null;
      hintTargets = rebuildHintTargets(mode);
      if (hintTargets.length === 0) {
        showHintToastError("No hints available");
        return false;
      }

      activeMode = mode;
      typedPrefix = "";
      activateSiteKeybindIgnore("hints");
      setMode("hint");
      renderHintTargets(hintTargets, improveThumbnailMarkers);
      return true;
    },
    exitHintMode,
    handleHintKeydown: (event: KeyboardEvent): boolean => {
      if (!activeMode) {
        return false;
      }

      if (event.key === "Escape") {
        exitHintMode();
        return true;
      }

      if (event.key === "Backspace") {
        typedPrefix = typedPrefix.slice(0, -1);
        updateVisibleTargets(hintTargets, typedPrefix, showCapitalizedLetters);
        return true;
      }

      if (toggleKey && typedPrefix.length === 0 && event.key.toLowerCase() === toggleKey) {
        exitHintMode();
        return true;
      }

      if (event.key === "Enter") {
        const exactMatch = hintTargets.find((target) => target.label === typedPrefix);
        if (exactMatch && activateHintTarget(activeMode, exactMatch)) {
          exitHintMode();
        }
        return true;
      }

      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
        return true;
      }

      const nextCharacter = event.key.toLowerCase();
      if (!hintTargets.some((target) => target.label.includes(nextCharacter))) {
        return true;
      }

      typedPrefix += nextCharacter;
      const matches = updateVisibleTargets(hintTargets, typedPrefix, showCapitalizedLetters);
      if (matches.length === 0) {
        typedPrefix = typedPrefix.slice(0, -1);
        updateVisibleTargets(hintTargets, typedPrefix, showCapitalizedLetters);
        return true;
      }

      const exactMatch = matches.find((target) => target.label === typedPrefix);
      if (exactMatch && matches.length === 1 && activateHintTarget(activeMode, exactMatch)) {
        exitHintMode();
      }

      return true;
    },
    isHintModeActive: (): boolean => activeMode !== null,
    setHintCharset: (value: string): void => {
      hintCharset = normalizeHintCharset(value);
    },
    setHintCss: (value: string): void => {
      hintCss = value;
      syncHintStyles(hintCss);
    },
    setMinLabelLength: (value: number): void => {
      minLabelLength = clampMinLabelLength(value);
    },
    setImproveThumbnailMarkers: (value: boolean): void => {
      improveThumbnailMarkers = value;
    },
    setShowCapitalizedLetters: (value: boolean): void => {
      showCapitalizedLetters = value;
    },
    setAvoidAdjacentPairs: (
      value: Partial<Record<string, Partial<Record<string, true>>>>
    ): void => {
      avoidAdjacentPairs = value;
    },
    setDirectiveLabels: (value: HintDirectiveLabelMap): void => {
      directiveLabels = value;
    },
    syncHintMarkers: (): void => {
      if (!activeMode) {
        return;
      }

      hintTargets = rebuildHintTargets(activeMode);
      if (hintTargets.length === 0) {
        exitHintMode();
        return;
      }

      renderHintTargets(hintTargets, improveThumbnailMarkers);
      updateVisibleTargets(hintTargets, typedPrefix, showCapitalizedLetters);
    },
    syncStyles: (): void => {
      syncHintStyles(hintCss);
    }
  };
};