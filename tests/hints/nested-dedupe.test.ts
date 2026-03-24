import { describe, test } from "bun:test";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";

describe("nested hint dedupe", () => {
  test("prefers a nested intrinsic link over an equivalent wrapper target", () => {
    runHintScenarioCase({
      fixtures: [
        "<div id='nav-item-wrapper' role='link' tabindex='0'><a id='nav-item-link' href='/feed/history'>History</a></div>"
      ],
      geometry: {
        "#nav-item-wrapper": { left: 20, top: 20, width: 220, height: 40 },
        "#nav-item-link": { left: 24, top: 22, width: 212, height: 36 }
      },
      elementsFromPointSelectors: ["#nav-item-link"],
      expect: {
        hintableSelectors: ["#nav-item-link"]
      }
    });
  });

  test("keeps distinct nested controls when the inner target is much smaller", () => {
    runHintScenarioCase({
      fixtures: [
        "<div id='item-row' role='link' tabindex='0'>",
        "  <span>Playlist row</span>",
        "  <button id='item-menu-button' type='button' aria-label='Open item actions'>Actions</button>",
        "</div>"
      ],
      geometry: {
        "#item-row": { left: 20, top: 20, width: 240, height: 44 },
        "#item-menu-button": { left: 220, top: 24, width: 32, height: 32 }
      },
      elementsFromPointSelectors: ["#item-menu-button"],
      expect: {
        hintableSelectors: ["#item-row", "#item-menu-button"]
      }
    });
  });
});