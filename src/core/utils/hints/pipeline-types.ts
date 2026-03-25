import type { HintLabelIcon, ReservedHintDirective } from "~/src/core/utils/hints/types";

export type HintPipelineTarget = {
  element: HTMLElement;
  label: string;
  directive: ReservedHintDirective | null;
  labelIcon: HintLabelIcon | null;
};