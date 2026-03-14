# Tests

This directory is focused on hint recognition cases so new fixtures can be added without editing
test logic.

## Structure

- `tests/hints.test.ts`: hint directive recognition tests from pasted element `outerHTML`.
- `tests/cases/hints.cases.ts`: input/output fixtures for hints tests.
- `tests/helpers/dom-fixture.ts`: JSDOM + geometry stubs for DOM-driven tests.

## Adding a hints case from pasted `outerHTML`

Add an item to `hintDirectiveCases` in `tests/cases/hints.cases.ts`:

```ts
{
  name: "your case name",
  for: "next",
  recognized: [
    "<button aria-label='Next page'>Next</button>",
  ],
  ignored: [
    "<button>Other</button>"
  ]
}
```

## Run

```bash
bun run test
```
