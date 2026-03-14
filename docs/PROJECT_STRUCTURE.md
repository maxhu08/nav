# Project Structure

Use this map to decide where new code should go.

## Main Directories

- `src/core/`: shared navigation runtime, content script entry, and page interaction logic.
- `src/background.ts`: background service worker for tab commands, frame messaging, and image fetch fallbacks.
- `src/options/`: options page scripts and helpers.
- `src/docs/`: docs page scripts.
- `src/popup/`: extension popup implementation.
- `src/lib/`: shared inline SVG/icon definitions used by runtime and extension pages.
- `src/static/`: files copied directly into `dist/` during build.
- `src/utils/`: shared config and reusable utilities.
- `src/shared/`: CSS shared across extension pages.
- `src/assets/`: extension icons and bundled assets.
- `scripts/`: build and packaging tasks.

## Core Navigation Runtime

- Shared runtime: `src/core/navigation.ts`
- Content script entry: `src/core/index.ts`
- Action handlers: `src/core/actions/`
- Core utilities: `src/core/utils/`
- `src/core/navigation.ts` wires runtime modules together and handles event registration.
- `src/core/utils/key-state.ts` is the runtime source of truth for hotkey sequence parsing and URL rule enforcement.
- `src/core/index.ts` only boots the shared runtime for normal webpages.

## Hints Pipeline

- Runtime coordinator and public hint API: `src/core/actions/hints.ts`
- Pipeline stage modules: `src/core/utils/hints/`
- Hints internals are split by responsibility so contributors can change one layer without reading the full pipeline first:
  - Shared hint mode/types: `src/core/utils/hints/model.ts`
  - DOM primitives, visibility checks, and geometry helpers: `src/core/utils/hints/dom.ts`
  - Target collection, dedupe, hover-only reveal logic, and public compatibility exports: `src/core/utils/hints/hint-recognition.ts`
  - Directive scoring and reserved-target selection (`@input`, `@attach`, `@home`, `@sidebar`, `@next`, `@prev`, `@cancel`, `@submit`, `@like`, `@dislike`): `src/core/utils/hints/directive-recognition.ts`
  - Reserved-label assignment: `src/core/utils/hints/semantics.ts`
  - Label generation: `src/core/utils/hints/labels.ts`
  - Marker DOM creation and updates: `src/core/utils/hints/markers.ts`
  - Marker layout and thumbnail placement: `src/core/utils/hints/layout.ts`
  - Overlay/style rendering: `src/core/utils/hints/renderer.ts`
  - Typed-input filtering: `src/core/utils/hints/input.ts`
- The hints flow is organized into explicit stages:
  1. Collect and dedupe hintable targets: `hint-recognition.ts` + `pipeline.ts` (`collectHintTargets`)
  2. Score directives and pick reserved targets: `directive-recognition.ts`
  3. Assign reserved labels for chosen directives: `semantics.ts`
  4. Generate and assign labels (charset, minimum length, reserved prefixes, blocked adjacent pairs, fallback): `labels.ts` + `pipeline.ts`
  5. Build marker models and marker DOM nodes: `markers.ts`
  6. Layout markers (thumbnail heuristics, collision avoidance, viewport clamping): `layout.ts`
  7. Render overlay and marker CSS: `renderer.ts`
  8. Apply typed-input filtering and marker visibility updates: `input.ts`
  9. Resolve exact matches, activate selected targets, and cleanup session state: `src/core/actions/hints.ts`
- Shared hints types live in `src/core/utils/hints/types.ts`.
- When adding a new directive, follow this order:
  1. Add the directive name in `src/utils/hint-reserved-label-directives.ts`
  2. Add its scoring logic and registry entry in `src/core/utils/hints/directive-recognition.ts`
  3. Add or extend test coverage in `tests/cases/hints.cases.ts` and `tests/hints.test.ts`

## Config Layers

- `src/utils/config.ts`: defines the persisted `config` object stored in `chrome.storage.local`.
- `config` keeps option values in the same shape the options UI edits them.
- Example: `config.rules.urls.mode` stores the active list, while `config.rules.urls.blacklist`, `config.rules.urls.whitelist`, and `config.hints.reservedLabels` store raw textarea strings.
- `src/utils/fast-config.ts`: defines `fastConfig`, a derived runtime cache built from `config`.
- `fastConfig.rules.urls` stores the active mode plus parsed blacklist and whitelist rule arrays.
- `fastConfig.hotkeys.mappings` is a parsed key-to-action map.
- `fastConfig.hotkeys.prefixes` is a derived lookup used for multi-key sequence matching.
- `fastConfig.hints.reservedLabels` stores parsed directive label arrays for special hint targets (for example `input`, `attach`, `home`, and `sidebar`).
- `src/options/scripts/utils/save-config.ts` writes both `config` and a rebuilt `fastConfig` together.
- In runtime, URL rule patterns are compiled to `RegExp` once on config apply (`src/core/utils/key-state.ts`) and reused for key matching.

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

## Popup and Background

- Popup entry: `src/popup.html`
- Popup scripts: `src/popup/`
- The popup mainly opens the options page and can pass the active tab URL into the options flow for quick site exclusion/inclusion.
- Background entry: `src/background.ts`
- The background worker handles tab-management actions, cross-frame runtime bridge messages, and fallback image fetching for clipboard copy.

## Debug Runtime

- Dev-only main-world debug entry: `src/core/debug/debug-main.ts`
- Supporting debug helpers: `src/core/debug/`
- Chrome dev builds add this extra entry so the extension can inspect page-level keyboard/debug behavior without shipping it in production packages.

## Build Scripts

- Task runner: `scripts/tasks.ts`
- This file handles `clean`, `dev`, `build`, `package`, `rc`, and `source` tasks.
- It bundles `src/background.ts`, `src/core/index.ts`, `src/core/debug/debug-main.ts`, `src/popup.html`, `src/options.html`, and `src/docs.html`.
- It generates manifests, runs Parcel, copies files from `src/static/`, and creates package artifacts.

## Useful Rule of Thumb

- If logic is shared between the content script and extension pages and it is part of navigation behavior, keep it in `src/core/`.
- If logic is shared between multiple features but is not tied to navigation runtime, put it in `src/utils/`.
- If logic is feature-specific, keep it in the closest folder (`core`, `options`, or `popup`).
