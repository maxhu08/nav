# Tests

This directory keeps hint tests data-driven.

## Rules

- Do not add website-specific logic to `tests/hints.test.ts`.
- Keep `tests/hint-layout.test.ts` focused on layout and collision behavior, not site-specific fixtures.
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
- `tests/hint-layout.test.ts`: focused regression coverage for marker placement and collision handling
- `tests/cases/hints.cases.ts`: all shared fixtures and expectations
- `tests/types.ts`: reusable case shapes
- `tests/helpers/dom-fixture.ts`: JSDOM and geometry stubs

## Source map

- `src/core/utils/hints/hint-recognition.ts`: collection, dedupe, and hover-only reveal behavior
- `src/core/utils/hints/directive-recognition.ts`: directive scoring and reserved target selection
- `src/core/utils/hints/semantics.ts`: reserved label assignment once directive targets are known
- `src/core/utils/hints/layout.ts`: marker placement and collision behavior

When a regression is about "wrong element got chosen for `@directive`", start with `directive-recognition.ts`.
When it is about "too many / too few hints showed up", start with `hint-recognition.ts`.
When it is about label conflicts or reserved labels, start with `semantics.ts` and `labels.ts`.
When it is about marker overlap or placement, start with `layout.ts`.

## Run

```bash
bun run test
```

Or run only one file while iterating:

```bash
bun test tests/hints.test.ts
bun test tests/hint-layout.test.ts
```
