import { describe, test } from "bun:test";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";
import type { HintScenarioCase } from "~/tests/types";

export const hintScenarioCases: HintScenarioCase[] = [
  {
    desc: "keeps a visible attach button hintable even when hit testing returns nothing",
    test: {
      fixtures: [
        "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button>"
      ],
      elementsFromPointSelectors: [],
      expect: {
        hintableSelectors: ["#composer-plus-btn"],
        directiveTargets: {
          attach: "#composer-plus-btn"
        }
      }
    }
  },
  {
    desc: "prefers the actual attach button over an overlapping wrapper container",
    test: {
      fixtures: [
        "<div role='button' tabindex='0' aria-label='Add files and more' data-testid='composer-plus-wrapper' data-state='closed'><button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button></div>"
      ],
      geometry: {
        "[data-testid='composer-plus-wrapper']": { left: 18, top: 18, width: 44, height: 44 },
        "[data-testid='composer-plus-btn']": { left: 20, top: 20, width: 40, height: 40 }
      },
      elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
      expect: {
        hintableSelectors: ["[data-testid='composer-plus-btn']"],
        directiveTargets: {
          attach: "[data-testid='composer-plus-btn']"
        }
      }
    }
  },
  {
    desc: "assigns @attach to the topmost overlapping attach control instead of its wrapper",
    test: {
      fixtures: [
        "<div role='button' tabindex='0' aria-label='Add files and more' data-testid='composer-plus-wrapper' data-state='closed'></div>",
        "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'></button>"
      ],
      geometry: {
        "[data-testid='composer-plus-wrapper']": { left: 20, top: 20, width: 40, height: 40 },
        "[data-testid='composer-plus-btn']": { left: 20, top: 20, width: 40, height: 40 }
      },
      elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
      expect: {
        directiveTargets: {
          attach: "[data-testid='composer-plus-btn']"
        }
      }
    }
  },
  {
    desc: "prefers the visible attach button over a nearby sr-only file input",
    test: {
      fixtures: [
        "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'></button>",
        "<input type='file' id='upload-photos' class='sr-only select-none' />"
      ],
      geometry: {
        "[data-testid='composer-plus-btn']": { left: 376, top: 384, width: 36, height: 36 },
        "#upload-photos": { left: 364, top: 430, width: 1, height: 1 }
      },
      elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
      expect: {
        directiveTargets: {
          attach: "[data-testid='composer-plus-btn']"
        }
      }
    }
  },
  {
    desc: "suppresses overlapping generic hints once the attach directive claims the target",
    test: {
      fixtures: [
        "<div role='button' tabindex='0' aria-label='Add files and more' data-testid='composer-plus-wrapper' data-state='closed'></div>",
        "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'></button>",
        "<div role='button' tabindex='0' aria-label='Open uploader menu' data-testid='composer-plus-generic'></div>"
      ],
      geometry: {
        "[data-testid='composer-plus-wrapper']": { left: 18, top: 18, width: 48, height: 48 },
        "[data-testid='composer-plus-btn']": { left: 20, top: 20, width: 40, height: 40 },
        "[data-testid='composer-plus-generic']": { left: 16, top: 16, width: 24, height: 24 }
      },
      elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
      reservedLabels: {
        attach: ["up"]
      },
      expect: {
        assignedTargets: [
          {
            selector: "[data-testid='composer-plus-btn']",
            directive: "attach"
          }
        ]
      }
    }
  },
  {
    desc: "recognizes an update-profile-photo control as attach without site-specific selectors",
    test: {
      fixtures: [
        "<button id='profile-photo-button' type='button' class='relative rounded-full p-1' aria-label='Update profile photo' aria-busy='false'><img alt='First Last' class='rounded-full object-cover' src='https://example.com/avatar.png' /><div class='absolute bottom-0 end-0'><div class='flex h-7 w-7 items-center justify-center rounded-full'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true'><path d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z'></path></svg></div></div></button>",
        "<button id='generic-profile-button' type='button' aria-label='Open profile menu'>Profile</button>"
      ],
      expect: {
        directiveTargets: {
          attach: "#profile-photo-button"
        }
      }
    }
  },
  {
    desc: "does not misclassify the Amazon language chooser as an attach control",
    test: {
      fixtures: [
        "<div class='nav-div nav-active' id='icp-nav-flyout'><a href='/customer-preferences/edit?ie=UTF8&amp;preferencesReturnUrl=%2F&amp;ref_=topnav_lang' class='nav-a nav-a-2 icp-link-style-2' aria-label='Choose a language for shopping in Amazon United States. The current selection is English (EN).'><span class='icp-nav-link-inner'><span class='nav-line-1'></span><span class='nav-line-2'><span class='icp-nav-flag icp-nav-flag-us icp-nav-flag-lop' role='img' aria-label='United States'></span><div>EN</div></span></span></a><button class='nav-flyout-button nav-icon nav-arrow nav-active' aria-label='Expand to Change Language or Country' tabindex='0' style='visibility: visible;' aria-expanded='true'></button></div>"
      ],
      expect: {
        missingDirectiveTargets: ["attach"]
      }
    }
  }
];

describe("attach hint scenarios", () => {
  for (const hintScenarioCase of hintScenarioCases) {
    test(hintScenarioCase.desc, () => {
      runHintScenarioCase(hintScenarioCase.test);
    });
  }
});