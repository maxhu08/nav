import { describe, test } from "bun:test";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";
import type { HintScenarioCase } from "~/tests/types";

export const hintScenarioCases: HintScenarioCase[] = [
  {
    desc: "drops intrinsic controls from hinting when another element fully covers them",
    test: {
      fixtures: [
        "<button id='covered-action' type='button' aria-label='Covered action'>Covered action</button>",
        "<div id='sticky-navbar-cover' aria-hidden='true'></div>"
      ],
      geometry: {
        "#covered-action": { left: 24, top: 24, width: 120, height: 40 },
        "#sticky-navbar-cover": { left: 24, top: 24, width: 120, height: 40 }
      },
      expect: {
        hintableSelectors: []
      }
    }
  }
];

describe("visibility hint scenarios", () => {
  for (const hintScenarioCase of hintScenarioCases) {
    test(hintScenarioCase.desc, () => {
      runHintScenarioCase(hintScenarioCase.test);
    });
  }
});