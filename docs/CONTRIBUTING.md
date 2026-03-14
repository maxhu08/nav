# Contributing

Use this page as the fast entry point for contributors.

## Quick Start

1. Read [Setup](./SETUP.md) and run the project locally.
2. Follow [Coding Style](./CODING_STYLE.md) while you code.
3. If you touch options UI or config persistence, read [Options Page](./OPTIONS_PAGE.md).
4. Check [Project Structure](./PROJECT_STRUCTURE.md) if you are unsure where code belongs.
5. Use [Committing](./COMMITTING.md) before opening a PR.

## Useful Things

- Run development build: `bun run dev` or `bun run dev:firefox`
- Build release artifacts: `bun run build:chrome` and `bun run build:firefox`
- Package zip files: `bun run package:chrome` and `bun run package:firefox`
- Build release candidate artifacts: `bun run rc:chrome` and `bun run rc:firefox`
- Package the source tree: `bun run package:source`
- Run tests: `bun run test`
- Validate changes before committing: `bun run check`
- Format code before committing: `bun run format`
- Formatter is also enforced by the pre-commit hook with `oxfmt`.
- Commit messages are also checked by `commitlint` in the `commit-msg` hook. See [Committing](./COMMITTING.md).

## Reporting Hint or Directive Issues

- If hint targeting, reserved labels, or directive behavior does not act as expected, write up the issue in a way that someone else can reproduce quickly.
- Include the page URL or site name, what target you expected nav to choose, what it picked instead, and whether the problem is specific to `@input`, `@attach`, `@next`, `@prev`, or another directive.
- If possible, include the relevant config values for `hints.reservedLabels`, `hints.charset`, `hints.minLabelLength`, and any matching `rules.urls.*` entries.
- Add screenshots, DOM snippets, or steps to reproduce when the issue depends on layout, overlays, or hover-only controls.
- Use [Issue Reporting](./ISSUE_REPORTING.md) for a copy-paste template.

## Hint Feature Workflow

- For hint changes, use `docs/PROJECT_STRUCTURE.md` as the file map before editing.
- New directive work usually touches three places: `src/utils/hint-reserved-label-directives.ts`, `src/core/utils/hints/directive-recognition.ts`, and `tests/cases/hints.cases.ts`.
- Collection and dedupe behavior belongs in `src/core/utils/hints/hint-recognition.ts`, while low-level DOM/visibility helpers belong in `src/core/utils/hints/dom.ts`.
- Prefer extending the directive registry in `src/core/utils/hints/directive-recognition.ts` instead of adding one-off branching elsewhere in the pipeline.

## Scope Notes

- Paths ending in `/` are directories.
- Keep PRs focused: one change-set, one clear purpose.
