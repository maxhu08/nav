# Tests

This directory keeps runtime behavior tests grouped by feature so new contributors can find the right coverage quickly.

## Rules

- Put tests in the folder that matches the feature under test.
- Keep `tests/hint-layout.test.ts` focused on marker placement and collision behavior.
- Put shared JSDOM fixtures, geometry stubs, and reusable helpers in `tests/helpers/`.
- Prefer small focused files over one large catch-all runner.
- Keep new test cases in a standardized shape so helpers can be reused across regressions.
- When adding site-specific regressions, sanitize copied markup and replace user/content-specific URLs, labels, counts, and media sources with generic placeholders before committing fixtures.

## Layout

- `tests/directives/*.test.ts`: directive recognition coverage grouped by directive name.
- `tests/hints/*.test.ts`: hint collection, visibility, and site-specific regressions.
- `tests/hint-layout.test.ts`: marker placement and collision handling.
- `tests/hint-markers.test.ts`: marker model creation and reserved-label marker state.
- `tests/hint-renderer.test.ts`: overlay and marker rendering behavior.
- `tests/hint-reveal.test.ts`: hover-only reveal behavior.
- `tests/watch-mode.test.ts`: watch mode route and video reacquisition behavior.
- `tests/config.test.ts`: config migration coverage.
- `tests/fast-config.test.ts`: derived runtime config parsing coverage.
- `tests/editor-highlight.test.ts`: options editor syntax-highlighting coverage.
- `tests/keyboard-priority.test.ts`: mode-aware keybinding priority coverage.
- `tests/url.test.ts`: URL normalization and cleanup coverage.
- `tests/types.ts`: reusable case shapes.
- `tests/helpers/`: JSDOM fixtures and reusable hint test helpers.

## Standardized formats

### Directive recognition cases

Use directive-specific cases for pure recognition checks:

```ts
attach: {
  desc: "detects attach",
  recognizes: ["<button aria-label='Add files and more'></button>"],
  ignored: ["<button>Other</button>"]
}
```

### Scenario cases

Use scenario cases for collection, dedupe, geometry, hit-testing, and label-assignment regressions:

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

## Source map

- `src/core/actions/hints.ts`: public hints facade used by the runtime.
- `src/core/actions/hints/controller.ts`: hint session lifecycle, filtering, caching, and activation flow.
- `src/core/utils/hints/hint-recognition.ts`: collection, dedupe, and hover-only reveal behavior.
- `src/core/utils/hints/directive-recognition.ts`: directive scoring and reserved target selection.
- `src/core/utils/hints/directive-recognition/action-directives.ts`: shared scoring helpers and tie-breakers for action-like directives.
- `src/core/utils/hints/semantics.ts`: reserved label assignment once directive targets are known.
- `src/core/utils/hints/layout.ts`: marker placement and collision behavior.

When a regression is about "wrong element got chosen for `@directive`", start with `src/core/utils/hints/directive-recognition.ts`.
If the directive is action-like and the wrong nearby button wins, inspect `src/core/utils/hints/directive-recognition/action-directives.ts` for missing strong signals or tie-breakers.
When it is about "too many / too few hints showed up", start with `src/core/utils/hints/hint-recognition.ts` and `src/core/actions/hints/controller.ts`.
When it is about label conflicts or reserved labels, start with `src/core/utils/hints/semantics.ts` and `src/core/utils/hints/labels.ts`.
When it is about marker overlap or placement, start with `src/core/utils/hints/layout.ts`.

## Run

```bash
bun run test
```

Or run a focused area while iterating:

```bash
bun test tests/hints
bun test tests/hint-layout.test.ts
bun test tests/directives/attach.test.ts
```
