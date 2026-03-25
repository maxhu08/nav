import { describe, test } from "bun:test";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";
import type { HintScenarioCase } from "~/tests/types";

export const hintScenarioCase: HintScenarioCase = {
  desc: "detects clear-input controls",
  test: {
    fixtures: [
      "<div role='search' id='search-shell'><input id='search-box' type='search' aria-label='Search' /><button id='clear-search' type='button' aria-label='Clear search'>Clear</button></div>",
      "<button id='close-dialog' type='button' aria-label='Close dialog'>Close</button>"
    ],
    expect: {
      directiveTargets: {
        erase: "#clear-search"
      }
    }
  }
};

describe("erase directive", () => {
  test(hintScenarioCase.desc, () => {
    runHintScenarioCase(hintScenarioCase.test);
  });
});