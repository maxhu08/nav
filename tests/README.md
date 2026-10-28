# Tests

This directory keeps runtime behavior tests grouped by feature so new contributors can find the right coverage quickly.

## Rules

- Put tests in the folder that matches the feature under test.
- Put shared JSDOM fixtures, geometry stubs, and reusable helpers in `tests/helpers/`.
- Prefer small focused files over one large catch-all runner.
- Keep new test cases in a standardized shape so helpers can be reused across regressions.
- When adding site-specific regressions, sanitize copied markup and replace user/content-specific URLs, labels, counts, and media sources with generic placeholders before committing fixtures.

## Layout

- `tests/watch-mode.test.ts`: watch mode route and video reacquisition behavior.
- `tests/config.test.ts`: config migration coverage.
- `tests/fast-config.test.ts`: derived runtime config parsing coverage.
- `tests/editor-highlight.test.ts`: options editor syntax-highlighting coverage.
- `tests/keyboard-priority.test.ts`: mode-aware keybinding priority coverage.
- `tests/url.test.ts`: URL normalization and cleanup coverage.
- `tests/types.ts`: reusable case shapes.
- `tests/helpers/`: JSDOM fixtures and reusable test helpers.
- `tests/visual-mode/`: visual bindings, migration, keyboard routing, clipboard behavior, and real-browser selection tests.

## Run

```bash
bun run test
```

Or run a focused area while iterating:

```bash
bun test tests/watch-mode.test.ts
bun test tests/config.test.ts
```

Native selection movement requires a real browser; JSDOM does not implement `Selection.modify()` or rendered lines. Run the browser suite with an isolated temporary profile (no extra dependencies):

```bash
bun scripts/test-visual-browser.ts "/path/to/chromium" chromium
bun scripts/test-visual-browser.ts "/path/to/firefox" firefox
```

The suite tests actual native selection and controller behavior, including wrapped lines, nested scrolling, editable content, find handoffs, and selection restoration. Clipboard writes and navigation are stubbed to avoid permission prompts and external navigation. This is not a packaged-extension installation test.

Chromium typing-flow tests use trusted keyboard events through DevTools. Firefox uses scripted keyboard events; native input/textarea movement remains unsupported there.
