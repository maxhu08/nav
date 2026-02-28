# Project Structure

Use this map to decide where new code should go.

## Main Directories

- `src/core/`: content script runtime and page interaction logic.
- `src/options/`: options page scripts and helpers.
- `src/popup/`: extension popup implementation.
- `src/utils/`: shared config and reusable utilities.
- `src/shared/`: CSS shared across extension pages.
- `src/assets/`: extension icons and bundled assets.
- `scripts/`: build and packaging tasks.

## Core Content Script

- Entry point: `src/core/index.ts`
- Action handlers: `src/core/actions/`
- Core utilities: `src/core/utils/`
- This is where hotkeys are parsed and page actions are executed.

## Options Page

- Page entry: `src/options.html`
- Main scripts: `src/options/scripts/`
- Fill helpers: `src/options/scripts/utils/fill-helpers/`
- Save helpers: `src/options/scripts/utils/save-helpers/`
- Save pipeline entry: `src/options/scripts/utils/save-config.ts`

## Build Scripts

- Task runner: `scripts/tasks.ts`
- This file handles `clean`, `dev`, `build`, `package`, `rc`, and `source` tasks.
- It generates manifests, runs Parcel, copies assets, and creates package artifacts.

## Useful Rule of Thumb

- If logic is shared between the content script and options page, put it in `src/utils/`.
- If logic is feature-specific, keep it in the closest folder (`core`, `options`, or `popup`).
