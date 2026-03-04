# Project Structure

Use this map to decide where new code should go.

## Main Directories

- `src/core/`: shared navigation runtime, content script entry, and page interaction logic.
- `src/options/`: options page scripts and helpers.
- `src/docs/`: docs page scripts.
- `src/popup/`: extension popup implementation.
- `src/utils/`: shared config and reusable utilities.
- `src/shared/`: CSS shared across extension pages.
- `src/assets/`: extension icons and bundled assets.
- `scripts/`: build and packaging tasks.

## Core Navigation Runtime

- Shared runtime: `src/core/navigation.ts`
- Content script entry: `src/core/index.ts`
- Action handlers: `src/core/actions/`
- Core utilities: `src/core/utils/`
- `src/core/navigation.ts` is the single place where parsed hotkeys and parsed URL rule lists are enforced at runtime.
- `src/core/index.ts` only boots the shared runtime for normal webpages.

## Config Layers

- `src/utils/config.ts`: defines the persisted `config` object stored in `chrome.storage.local`.
- `config` keeps option values in the same shape the options UI edits them.
- Example: `config.rules.urls.mode` stores the active list, while `config.rules.urls.blacklist` and `config.rules.urls.whitelist` store the raw textarea strings.
- `src/utils/fast-config.ts`: defines `fastConfig`, a derived runtime cache built from `config`.
- `fastConfig.rules.urls` stores the active mode plus parsed blacklist and whitelist rule arrays.
- `fastConfig.hotkeys.mappings` is a parsed key-to-action map.
- `fastConfig.hotkeys.prefixes` is a derived lookup used for multi-key sequence matching.
- `src/options/scripts/utils/save-config.ts` writes both `config` and a rebuilt `fastConfig` together.

## Options Page

- Page entry: `src/options.html`
- Init script: `src/options/scripts/init.ts`
- Main scripts: `src/options/scripts/`
- Fill helpers: `src/options/scripts/utils/fill-helpers/`
- Save helpers: `src/options/scripts/utils/save-helpers/`
- Save pipeline entry: `src/options/scripts/utils/save-config.ts`
- The options page reads and writes `config`, rebuilds `fastConfig`, and boots the shared core navigation runtime.

## Docs Page

- Page entry: `src/docs.html`
- Init script: `src/docs/scripts/init.ts`
- The docs page is mostly static markup, but it also boots the shared core navigation runtime so hotkeys and hints behave the same there.

## Build Scripts

- Task runner: `scripts/tasks.ts`
- This file handles `clean`, `dev`, `build`, `package`, `rc`, and `source` tasks.
- It generates manifests, runs Parcel, copies assets, and creates package artifacts.

## Useful Rule of Thumb

- If logic is shared between the content script and extension pages and it is part of navigation behavior, keep it in `src/core/`.
- If logic is shared between multiple features but is not tied to navigation runtime, put it in `src/utils/`.
- If logic is feature-specific, keep it in the closest folder (`core`, `options`, or `popup`).
