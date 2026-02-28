# Committing

## Commit Message

- Use Conventional Commits format:
  - `type(optional-scope): short summary`
- Common types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`.
- Examples:
  - `feat(core): add multi-key sequence handling`
  - `fix(options): persist hotkey mappings`
  - `docs(contributing): add setup guide`
- Include issue number when relevant:
  - `feat(core): add multi-key sequence handling (#11)`

## Pre-Commit Hook

- Husky formats staged files before commit with Prettier.

## Before Opening a PR

1. Ensure the feature works locally.
2. Run `bun run check`.
3. Push your branch and open a PR with a clear change summary.
