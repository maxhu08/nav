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
- This is where parsed hotkeys and parsed `rules.urls` are enforced at runtime.

## Config Layers

- `src/utils/config.ts`: defines the persisted `config` object stored in `chrome.storage.local`.
- `config` keeps option values in the same shape the options UI edits them.
- Example: `config.rules.urls` is stored as the raw textarea string.
- `src/utils/fast-config.ts`: defines `fastConfig`, a derived runtime cache built from `config`.
- `fastConfig.rules.urls` is a parsed array of URL rules.
- `fastConfig.hotkeys.mappings` is a parsed key-to-action map.
- `fastConfig.hotkeys.prefixes` is a derived lookup used for multi-key sequence matching.
- `src/options/scripts/utils/save-config.ts` writes both `config` and a rebuilt `fastConfig` together.

## Options Page

- Page entry: `src/options.html`
- Main scripts: `src/options/scripts/`
- Fill helpers: `src/options/scripts/utils/fill-helpers/`
- Save helpers: `src/options/scripts/utils/save-helpers/`
- Save pipeline entry: `src/options/scripts/utils/save-config.ts`
- The options page reads and writes `config`, then rebuilds `fastConfig` for the content script.

## Build Scripts

- Task runner: `scripts/tasks.ts`
- This file handles `clean`, `dev`, `build`, `package`, `rc`, and `source` tasks.
- It generates manifests, runs Parcel, copies assets, and creates package artifacts.

## Useful Rule of Thumb

- If logic is shared between the content script and options page, put it in `src/utils/`.
- If logic is feature-specific, keep it in the closest folder (`core`, `options`, or `popup`).
