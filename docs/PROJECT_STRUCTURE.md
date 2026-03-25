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

- Runtime coordinator and public hint API: `src/core/actions/hints.ts`
- Hint action helpers: `src/core/actions/hints/`
- Pipeline stage modules: `src/core/utils/hints/`
- Hints internals are split by responsibility so contributors can change one layer without reading the full pipeline first:
  - Shared hint mode/types: `src/core/utils/hints/model.ts`
  - DOM facade re-exporting shared hint DOM helpers: `src/core/utils/hints/dom.ts`
  - DOM geometry helpers: `src/core/utils/hints/dom/geometry.ts`
  - DOM interactivity and target-preference scoring: `src/core/utils/hints/dom/interactive.ts`
  - DOM visibility and hit-testing helpers: `src/core/utils/hints/dom/visibility.ts`
  - DOM shared hint types/constants: `src/core/utils/hints/dom/shared.ts`
  - Hint session lifecycle and activation entrypoint: `src/core/actions/hints/controller.ts`
  - Hint activation behavior (focus, click simulation, tab-open behavior): `src/core/actions/hints/activation.ts`
  - Target collection facade and public compatibility exports: `src/core/utils/hints/hint-recognition.ts`
  - Hint collection and ordering: `src/core/utils/hints/hint-recognition/collection.ts`
  - Hint collection caches and derived context: `src/core/utils/hints/hint-recognition/context.ts`
  - Hint dedupe pipeline facade: `src/core/utils/hints/hint-recognition/dedupe.ts`
  - Structural equivalent-target dedupe: `src/core/utils/hints/hint-recognition/equivalent.ts`
  - Label/control dedupe: `src/core/utils/hints/hint-recognition/labels.ts`
  - File-input attach dedupe: `src/core/utils/hints/hint-recognition/attach.ts`
  - Spatial semantic dedupe: `src/core/utils/hints/hint-recognition/semantic.ts`
  - Ancestor-link suppression: `src/core/utils/hints/hint-recognition/ancestor.ts`
  - Hint-recognition shared types: `src/core/utils/hints/hint-recognition/shared.ts`
  - Hover-only reveal helpers: `src/core/utils/hints/hint-recognition/reveal.ts`
  - Directive recognition facade and public exports: `src/core/utils/hints/directive-recognition.ts`
  - Directive registry and thresholds: `src/core/utils/hints/directive-recognition/definitions.ts`
  - Directive candidate generation and shared feature cache: `src/core/utils/hints/directive-recognition/candidate-generation.ts`
  - Directive winner selection: `src/core/utils/hints/directive-recognition/winner-selection.ts`
  - Directive post-selection remapping (`attach`, `sidebar`): `src/core/utils/hints/directive-recognition/post-selection.ts`
  - Shared directive scorer helpers: `src/core/utils/hints/directive-recognition/scoring.ts`
  - Shared directive geometry helpers: `src/core/utils/hints/directive-recognition/geometry.ts`
  - Shared directive text/feature helpers and constants: `src/core/utils/hints/directive-recognition/shared.ts`
  - Directive-specific shared types: `src/core/utils/hints/directive-recognition/types.ts`
  - Input and attach scoring: `src/core/utils/hints/directive-recognition/input-attach.ts`
  - Home and sidebar scoring: `src/core/utils/hints/directive-recognition/home-sidebar.ts`
  - Action-like directive scoring (`next`, `prev`, `cancel`, `submit`, `share`, `download`, `login`, `microphone`, reactions): `src/core/utils/hints/directive-recognition/action-directives.ts`
  - Reserved-label assignment: `src/core/utils/hints/semantics.ts`
  - Label generation: `src/core/utils/hints/labels.ts`
  - Hint pipeline target types: `src/core/utils/hints/pipeline-types.ts`
  - Marker DOM creation and updates: `src/core/utils/hints/markers.ts`
  - Marker layout facade: `src/core/utils/hints/layout.ts`
  - Shared layout constants/types: `src/core/utils/hints/layout/shared.ts`
  - Layout-only extracted types: `src/core/utils/hints/layout/types.ts`
  - Thumbnail heuristics and marker sizing: `src/core/utils/hints/layout/thumbnail.ts`
  - Position candidate generation: `src/core/utils/hints/layout/placement.ts`
  - Collision and occlusion scoring: `src/core/utils/hints/layout/collision.ts`
  - Video-control reveal helpers: `src/core/utils/hints/layout/video.ts`
  - Overlay/style rendering: `src/core/utils/hints/renderer.ts`
  - Typed-input filtering: `src/core/utils/hints/input.ts`
- The hints flow is organized into explicit stages:
  1. Collect and dedupe hintable targets: `hint-recognition.ts`, `hint-recognition/collection.ts`, `hint-recognition/dedupe.ts`, and `pipeline.ts` (`collectHintTargets`)
  2. Generate directive candidates from shared feature caches: `directive-recognition/candidate-generation.ts`
  3. Select winning reserved targets per directive using the registry thresholds and directive order: `directive-recognition/winner-selection.ts`
  4. Remap presentation-sensitive directives like `attach` and `sidebar` after selection: `directive-recognition/post-selection.ts`
  5. Assign reserved labels for chosen directives: `semantics.ts`
  6. Generate and assign labels (charset, minimum length, reserved prefixes, blocked adjacent pairs, fallback): `labels.ts` + `pipeline.ts`
  7. Build marker models and marker DOM nodes: `markers.ts`
  8. Layout markers (thumbnail heuristics, collision avoidance, viewport clamping): `layout.ts` plus `layout/`
  9. Render overlay and marker CSS: `renderer.ts`
  10. Apply typed-input filtering and marker visibility updates: `input.ts`
  11. Resolve exact matches, activate selected targets, and cleanup session state: `src/core/actions/hints/controller.ts`
- Shared hints types live in `src/core/utils/hints/types.ts`.
- When adding a new directive, follow this order:
  1. Add the directive name in `src/utils/hint-reserved-label-directives.ts`
  2. Add its default reserved label in `src/utils/hotkeys.ts`
  3. Add its scorer and registry entry in `src/core/utils/hints/directive-recognition/definitions.ts`
  4. Add or extend directive-specific patterns and scorer helpers in the closest helper under `src/core/utils/hints/directive-recognition/`
  5. Add its inline marker icon path in `src/lib/inline-icons.ts` and wire it in `src/core/utils/hints/markers.ts`
  6. Update marker priority in `src/core/utils/hints/layout/shared.ts` if the directive should participate in reserved marker ordering
  7. Update the user-facing directive list and examples in `src/docs.html`
  8. Add or extend test coverage in the matching file under `tests/directives/` and `tests/hints/`
- `src/utils/migrate-config.ts` should only preserve backward compatibility for config shape or renamed values; it should not silently re-add settings a user intentionally removed.
- For icon work, prefer copying the path data from the matching reference SVG under `src/assets/remixicon-reference/` into `src/lib/inline-icons.ts` instead of adding runtime file lookups.
- For new action-like directives, check `src/core/utils/hints/directive-recognition/action-directives.ts` first; many directives need both broad patterns and a stronger tie-breaker score so nearby generic controls do not win.
- For high-level design context, read `docs/HINTS_ARCHITECTURE.md`, `docs/DIRECTIVE_RECOGNITION.md`, and `docs/MARKER_LAYOUT.md`.

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

- Find mode facade: `src/core/actions/find-mode.ts`
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
