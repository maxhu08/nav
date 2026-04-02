# Testing

Keep tests small, readable, and easy to place.

## Test Layout

- Keep feature-specific coverage in the closest matching area under `tests/`.
- `tests/hint-mode/` holds hint-mode regressions, including directive-recognition cases and site-specific fixtures.
- Put shared JSDOM fixtures and reusable helpers in `tests/helpers/`.
- Prefer small focused files over broad catch-all suites.

## Adding Test Cases

- Add coverage for every behavior change or bug fix.
- Prefer placing a new test in an existing file when it clearly fits that file's scope.
- If a case does not fit cleanly with an existing file, create a new test file with a focused name.
- Keep each test file centered on one feature, behavior group, or regression theme.

## Test Data

- Replace exposing or real-looking data with generic placeholders.
- Use generic text, URLs, labels, IDs, and names unless a specific value is important to the behavior under test.
- If part of the data matters to the assertion, keep only the relevant portion realistic and sanitize the rest.

## Before Finishing

- Make sure all affected test cases pass whenever you make a change.
- If possible, run the targeted tests for the area you changed plus any broader checks needed for confidence.

## Common Commands

- Run the full suite: `bun run test`
- Run one file: `bun test tests/config.test.ts`
- Run a feature folder while iterating: `bun test tests/hint-mode`
- Run the repo-wide validation pass: `bun run check`
