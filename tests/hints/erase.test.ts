import { describe, test } from "bun:test";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";
import type { HintScenarioCase } from "~/tests/types";

export const hintScenarioCases: HintScenarioCase[] = [
  {
    desc: "assigns both input and erase directives to the same primary input when no clear button exists",
    test: {
      fixtures: ["<input id='search-box' type='search' aria-label='Search' />"],
      reservedLabels: {
        input: ["kj"],
        erase: ["er"]
      },
      expect: {
        assignedTargets: [
          {
            selector: "#search-box",
            directive: "input"
          },
          {
            selector: "#search-box",
            directive: "erase"
          }
        ]
      }
    }
  }
];

describe("erase hint scenarios", () => {
  for (const hintScenarioCase of hintScenarioCases) {
    test(hintScenarioCase.desc, () => {
      runHintScenarioCase(hintScenarioCase.test);
    });
  }
});