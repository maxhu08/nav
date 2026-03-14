import type { ReservedHintDirective } from "~/src/utils/hint-reserved-label-directives";

export type HintDirectiveCase = {
  name: string;
  for: ReservedHintDirective;
  recognized: string[];
  ignored: string[];
};