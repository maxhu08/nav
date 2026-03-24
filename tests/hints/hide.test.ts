import { describe, test } from "bun:test";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";
import type { HintScenarioCase } from "~/tests/types";

export const hintScenarioCases: HintScenarioCase[] = [
  {
    desc: "assigns the hide directive to a popup backdrop when no dismiss button exists",
    test: {
      fixtures: [
        "<div id='download-popup-wrapper' class='rd-popup-wrapper'><div id='download-popup' class='rd-popup download-list'><div class='rd-popup-body'><div class='rd-popup-content'><h2 class='rd-popup-title'>Download</h2><ul><li class='download-type'><a id='download-icon-pack' href='/icon-pack.zip' download title='download'></a></li><li class='download-type'><a id='download-fonts' href='/fonts.zip' download title='download'></a></li></ul></div></div></div></div>"
      ],
      geometry: {
        "#download-popup-wrapper": { left: 0, top: 0, width: 360, height: 260 },
        "#download-popup": { left: 56, top: 36, width: 248, height: 188 },
        "#download-icon-pack": { left: 260, top: 92, width: 24, height: 24 },
        "#download-fonts": { left: 260, top: 132, width: 24, height: 24 }
      },
      reservedLabels: {
        hide: ["hi"]
      },
      expect: {
        directiveTargets: {
          hide: "#download-popup-wrapper"
        }
      }
    }
  },
  {
    desc: "does not assign the hide directive when the popup already has a close button",
    test: {
      fixtures: [
        "<div id='dialog-overlay' class='modal-overlay'><div id='dialog-surface' class='modal-dialog' role='dialog' aria-modal='true'><button id='dialog-close' type='button' aria-label='Close dialog'>Close</button><p>Example dialog</p></div></div>"
      ],
      geometry: {
        "#dialog-overlay": { left: 0, top: 0, width: 360, height: 240 },
        "#dialog-surface": { left: 80, top: 40, width: 200, height: 120 },
        "#dialog-close": { left: 244, top: 52, width: 24, height: 24 }
      },
      expect: {
        missingDirectiveTargets: ["hide"]
      }
    }
  }
];

describe("hide hint scenarios", () => {
  for (const hintScenarioCase of hintScenarioCases) {
    test(hintScenarioCase.desc, () => {
      runHintScenarioCase(hintScenarioCase.test);
    });
  }
});