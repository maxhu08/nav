import type { ReservedHintDirective } from "~/src/utils/hint-reserved-label-directives";

export type HintDirectiveCase = {
  desc: string;
  recognizes: string[];
  ignored: string[];
};

export type HintDirectiveCases = Record<ReservedHintDirective, HintDirectiveCase>;