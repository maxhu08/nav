# Tests

This directory keeps hint tests data-driven.

## Rules

- Do not add website-specific logic to `tests/hints.test.ts`.
- Put site-specific HTML, geometry, and hit-testing behavior in `tests/cases/hints.cases.ts`.
- Keep every new case in the same standardized shape so future regressions can reuse the same runner.
- Prefer shared cases over one-off test code.

## Standardized formats

### Directive recognition cases

Use `hintDirectiveCases` for pure recognition checks:

```ts
attach: {
  desc: "detects attach",
  recognizes: [
    "<button aria-label='Add files and more'></button>"
  ],
  ignored: [
    "<button>Other</button>"
  ]
}
```

### Scenario cases

Use `hintScenarioCases` for collection, dedupe, geometry, hit-testing, and label-assignment regressions:

```ts
{
  desc: "prefers visible attach button over nearby hidden file input",
  fixtures: [
    "<button data-testid='composer-plus-btn' aria-label='Add files and more'></button>",
    "<input type='file' id='upload-photos' class='sr-only' />"
  ],
  geometry: {
    "[data-testid='composer-plus-btn']": { left: 376, top: 384, width: 36, height: 36 },
    "#upload-photos": { left: 364, top: 430, width: 1, height: 1 }
  },
  elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
  reservedLabels: {
    attach: ["up"]
  },
  expect: {
    directiveTargets: {
      attach: "[data-testid='composer-plus-btn']"
    },
    assignedTargets: [
      {
        selector: "[data-testid='composer-plus-btn']",
        directive: "attach"
      }
    ]
  }
}
```

## Files

- `tests/hints.test.ts`: generic runner for directive and scenario cases
- `tests/cases/hints.cases.ts`: all shared fixtures and expectations
- `tests/types.ts`: reusable case shapes
- `tests/helpers/dom-fixture.ts`: JSDOM and geometry stubs

## Run

```bash
bun test tests/hints.test.ts
```
