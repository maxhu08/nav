# Contributing

Use this page as the fast entry point for contributors.

## Quick Start

1. Read [Setup](./SETUP.md) and run the project locally.
2. Follow [Coding Style](./CODING_STYLE.md) while you code.
3. If you add or rename an action, read [Adding Actions](./ADDING_ACTIONS.md).
4. If you touch options UI or config persistence, read [Options Page](./OPTIONS_PAGE.md).
5. Check [Project Structure](./PROJECT_STRUCTURE.md) if you are unsure where code belongs.
6. Use [Committing](./COMMITTING.md) before opening a PR.

## Useful Things

- Run development build: `bun run dev` or `bun run dev:firefox`
- Build release artifacts: `bun run build:chrome` and `bun run build:firefox`
- Package zip files: `bun run package:chrome` and `bun run package:firefox`
- Build release candidate artifacts: `bun run rc:chrome` and `bun run rc:firefox`
- Package the source tree: `bun run package:source`
- Run tests: `bun run test`
- Validate changes before committing: `bun run check`
- Make sure all relevant test cases pass before committing.
- Format code before committing: `bun run format`
- Formatter is also enforced by the pre-commit hook with `oxfmt`.
- Commit messages are also checked by `commitlint` in the `commit-msg` hook. See [Committing](./COMMITTING.md).

## Reporting Hint Issues

- If hint targeting or label behavior does not act as expected, write up the issue in a way that someone else can reproduce quickly.
- Include the page URL or site name, what target you expected nav to choose, and what it picked instead.
- If possible, include the relevant config values for `hints.charset`, `hints.minLabelLength`, and any matching `rules.urls.*` entries.
- Add screenshots, DOM snippets, or steps to reproduce when the issue depends on layout, overlays, or hover-only controls.
- Use [Issue Reporting](./ISSUE_REPORTING.md) for a copy-paste template.

## Hint Feature Workflow

- For hint changes, use `docs/PROJECT_STRUCTURE.md` as the file map before editing.
- Collection and target discovery behavior belongs under `src/core/utils/hint-mode/collection/`, directive scoring belongs under `src/core/utils/hint-mode/directive-recognition/`, and rendering belongs under `src/core/utils/hint-mode/rendering/`.
- Follow the existing directive style: keep each directive scorer in its own file under `src/core/utils/hint-mode/directive-recognition/` and keep shared scoring helpers in `shared.ts`.
- Use `src/utils/migrate-config.ts` for config-shape compatibility, renamed values, and required backfills such as missing hotkey declarations or missing hint directives.
- Keep directive icon definitions in `src/lib/hint-directive-icons.ts` and marker-specific rendering in `src/core/utils/hint-mode/rendering/`.

## Refactor Conventions

- Keep top-level runtime files such as `src/core/navigation.ts`, `src/core/actions/hint-mode/index.ts`, and `src/core/actions/watch-mode.ts` as facades with stable exports.
- When a feature grows, prefer adding a nearby helper module directory before expanding one file indefinitely.
- Source files should stay readable and intentionally scoped; as a rule of thumb, split them before they grow past roughly 500 lines.

## Scope Notes

- Paths ending in `/` are directories.
- Keep PRs focused: one change-set, one clear purpose.
