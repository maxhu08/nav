import type {
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/utils/hint-reserved-label-directives";

export type HintDirectiveCase = {
  desc: string;
  recognizes: string[];
  ignored: string[];
};

export type HintDirectiveCases = Record<ReservedHintDirective, HintDirectiveCase>;

export type HintRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HintScenarioExpectation = {
  hintableSelectors?: string[];
  directiveTargets?: Partial<Record<ReservedHintDirective, string>>;
  assignedTargets?: Array<{
    selector: string;
    directive: ReservedHintDirective | null;
  }>;
};

export type HintScenarioCase = {
  desc: string;
  fixtures: string[];
  geometry?: Record<string, HintRect>;
  elementsFromPointSelectors?: string[];
  reservedLabels?: Partial<ReservedHintLabels>;
  expect: HintScenarioExpectation;
};