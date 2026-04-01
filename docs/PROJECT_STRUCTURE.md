# Project Structure

Use this map to decide where new code should go.

## Main Directories

- `src/core/`: shared navigation runtime, content script entry, and page interaction logic.
- `src/background.ts`: background service worker for tab commands, frame messaging, and image fetch fallbacks.
- `src/options/`: options page scripts, styles, and helpers.
- `src/docs/`: docs page scripts.
- `src/popup/`: extension popup implementation.
- `src/lib/`: shared inline SVG/icon definitions used by runtime and extension pages.
- `src/static/`: files copied directly into `dist/` during build.
- `src/utils/`: shared config and reusable utilities.
- `src/shared/`: shared CSS plus cross-context message and runtime-bridge definitions.
- `src/assets/`: extension icons and bundled assets.
- `scripts/`: build and packaging tasks.

## Core Navigation Runtime

- Shared runtime entry and wiring: `src/core/navigation.ts`
- Navigation helper modules: `src/core/navigation/`
- Content script entry: `src/core/index.ts`
- Action handlers: `src/core/actions/`
- Core utilities: `src/core/utils/`
- `src/core/navigation.ts` wires feature controllers together and keeps runtime startup flow in one place.
- `src/core/navigation/frame-actions.ts` handles frame-proxied actions and message validation.
- `src/core/navigation/force-normal-mode.ts` owns startup editable-focus guards for force-normal-mode.
- `src/core/navigation/init-listeners.ts` installs runtime DOM listeners and cross-feature event bridges.
- `src/core/utils/key-state.ts` is the runtime source of truth for hotkey sequence parsing and URL rule enforcement.
- `src/core/index.ts` only boots the shared runtime for normal webpages.

## Hints Pipeline

- Runtime coordinator and public hint API: `src/core/actions/hint-mode/index.ts`
- Pipeline stage modules: `src/core/utils/hint-mode/`
- Hint internals are split by responsibility so contributors can change one layer without reading the full pipeline first:
  - Session lifecycle, typed-prefix handling, and config application: `src/core/actions/hint-mode/index.ts`
  - Target collection and target model building: `src/core/utils/hint-mode/collection/`
  - Label generation and charset normalization: `src/core/utils/hint-mode/generation/`
  - Directive scoring and best-target recognition: `src/core/utils/hint-mode/directive-recognition/`
  - Marker rendering, layout, and overlay syncing: `src/core/utils/hint-mode/rendering/`
  - Activation side effects and clipboard helpers: `src/core/utils/hint-mode/actions/`
  - Shared constants and types: `src/core/utils/hint-mode/shared/`
- The hints flow is organized into explicit stages:
  1. Collect visible, hintable elements and build target metadata: `collection/collect-elements.ts`, `collection/get-hintable-elements.ts`, and `collection/build-hint-targets.ts`
  2. Score directive candidates and attach directive markers where applicable: `directive-recognition/` plus `collection/build-hint-targets.ts`
  3. Generate labels from charset, minimum length, and blocked adjacent pairs: `generation/generate-hint-labels.ts`
  4. Create marker DOM, sync styles, and place markers: `rendering/create-marker-element.ts`, `rendering/render-hint-targets.ts`, and `rendering/position-marker-element.ts`
  5. Apply typed-prefix filtering and marker visibility updates: `rendering/update-visible-targets.ts`
  6. Resolve exact matches, activate selected targets, and cleanup session state: `src/core/actions/hint-mode/index.ts` plus `actions/activate-hint-target.ts`
- Shared hint-mode types live in `src/core/utils/hint-mode/shared/types.ts`.
- `src/utils/migrate-config.ts` preserves backward compatibility for config shape, renamed values, and required backfills for missing hotkey or directive declarations.
- For icon work, prefer copying the path data from the matching reference SVG under `src/assets/remixicon-reference/` into `src/lib/inline-icons.ts` instead of adding runtime file lookups.

## Config Layers

- `src/utils/config.ts`: defines the persisted `config` object stored in `chrome.storage.local`.
- `config` keeps option values in the same shape the options UI edits them.
- Example: `config.rules.urls.mode` stores the active list, while `config.rules.urls.blacklist`, `config.rules.urls.whitelist`, `config.hotkeys.mappings`, and `config.hints.directives` store raw editable strings.
- `src/utils/fast-config.ts`: defines `fastConfig`, a derived runtime cache built from `config`.
- `fastConfig.rules.urls` stores the active mode plus parsed blacklist and whitelist rule arrays.
- `fastConfig.hotkeys.mappings` is a parsed key-to-action map that excludes `<unbound>` declarations.
- `fastConfig.hotkeys.prefixes` is a derived lookup used for multi-key sequence matching.
- `hotkeys.mappings` must declare every action at least once; use `<unbound> action-name` to keep an action intentionally unbound.
- `hints.directives` must contain exactly one line for each reserved directive; use `@directive <unbound>` to keep a directive intentionally unbound.
- `fastConfig.hints.directives` stores the parsed directive label map used at runtime, with `<unbound>` lines normalized to empty label arrays.
- `src/options/scripts/utils/save-config.ts` writes both `config` and a rebuilt `fastConfig` together.
- In runtime, URL rule patterns are compiled to `RegExp` once on config apply (`src/core/utils/key-state.ts`) and reused for key matching.

## Options Page

- Page entry: `src/options.html`
- Init script: `src/options/scripts/init.ts`
- Main scripts: `src/options/scripts/`
- Options styles entry: `src/options/styles/index.css`
- Split options styles: `src/options/styles/*.css`
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
- Background runtime bridge fanout: `src/background/bridge.ts`
- Background tab-command handlers: `src/background/tab-commands.ts`
- Background image-fetch fallback: `src/background/fetch-image.ts`
- Shared background/runtime message shapes: `src/shared/background-messages.ts` and `src/shared/runtime-bridge.ts`
- The background worker handles tab-management actions, cross-frame runtime bridge messages, and fallback image fetching for clipboard copy.

## Other Refactored Runtime Areas

- Find mode facade: `src/core/actions/find-mode/index.ts`
- Find mode UI builder/helpers: `src/core/actions/find-mode/ui.ts`
- Watch mode facade: `src/core/actions/watch-mode.ts`
- Watch mode shared constants/types: `src/core/actions/watch-mode/shared.ts`
- Watch control facade: `src/core/actions/watch-mode/controls.ts`
- Watch control text/keyword helpers: `src/core/actions/watch-mode/control-text.ts`
- Watch control detection and scoring: `src/core/actions/watch-mode/control-detection.ts`
- Watch control state inference: `src/core/actions/watch-mode/control-state.ts`
- Watch mute fallback helper: `src/core/actions/watch-mode/mute.ts`
- Watch toggle-state inference helpers: `src/core/actions/watch-mode/toggle-state.ts`
- Watch mode toggle helpers shared by watch-mode and direct actions: `src/core/actions/watch-mode/toggles.ts`
- Watch overlay rendering: `src/core/actions/watch-mode/overlay.ts`
- Watch video discovery and text-track helpers: `src/core/actions/watch-mode/video-state.ts`
- Toast facade: `src/core/utils/sonner.ts`
- Toast assets, rendering, and injected styles: `src/core/utils/sonner/assets.ts`, `src/core/utils/sonner/render.ts`, and `src/core/utils/sonner/style.ts`

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
