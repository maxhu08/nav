import type {
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/utils/hint-reserved-label-directives";

export type TestDefinition<T> = {
  desc: string;
  test: T;
};

export type DirectiveTestType = {
  recognizes: string[];
  ignores: string[];
};

export type DirectiveTestCase = TestDefinition<DirectiveTestType>;

export type HintRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HintScenarioExpectation = {
  hintableSelectors?: string[];
  directiveTargets?: Partial<Record<ReservedHintDirective, string>>;
  missingDirectiveTargets?: ReservedHintDirective[];
  assignedTargets?: Array<{
    selector: string;
    directive: ReservedHintDirective | null;
  }>;
};

export type HintScenarioTestType = {
  fixtures: string[];
  geometry?: Record<string, HintRect>;
  elementsFromPointSelectors?: string[];
  reservedLabels?: Partial<ReservedHintLabels>;
  expect: HintScenarioExpectation;
};

export type HintScenarioCase = TestDefinition<HintScenarioTestType>;

export type ConfigMigrationTestType = () => void;

export type ConfigMigrationTestCase = TestDefinition<ConfigMigrationTestType>;

export type HintLayoutTestType = () => void;

export type HintLayoutTestCase = TestDefinition<HintLayoutTestType>;