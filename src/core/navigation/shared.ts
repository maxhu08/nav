import type { ActionName } from "~/src/utils/hotkeys";

export type ActionHandler = (count?: number) => boolean;
export type CoreMode = "normal" | "find" | "hint" | "watch";

export const createModeController = () => {
  let currentMode: CoreMode = "normal";

  return {
    getMode: (): CoreMode => currentMode,
    isMode: (mode: CoreMode): boolean => currentMode === mode,
    setMode: (mode: CoreMode): void => {
      currentMode = mode;
    }
  };
};

export const createScrollActionSet = (): Set<ActionName> => {
  return new Set<ActionName>([
    "scroll-down",
    "scroll-half-page-down",
    "scroll-half-page-up",
    "scroll-left",
    "scroll-right",
    "scroll-up",
    "scroll-to-bottom",
    "scroll-to-top"
  ]);
};