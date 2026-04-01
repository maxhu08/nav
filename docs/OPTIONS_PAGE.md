# Options Page

This page covers the minimum conventions required to add new options safely.

## Naming Rules

- Config section names come from config keys.
- The options UI edits the persisted `config` shape, not `fastConfig`.
- Textarea helpers use the suffix pattern:
  - Container: `feature-name-container`
  - Textarea: `feature-name-textarea`
- Button helpers use the suffix pattern:
  - Button: `action-name-button`

Example:

- Config key: `hotkeys.mappings`
- Container ID: `hotkeys-mappings-container`
- Textarea ID: `hotkeys-mappings-textarea`
- Save button ID: `save-button`

## Required Wiring When Adding a New Input

1. Add the input markup to `src/options.html` with IDs that match the helper naming rules.
2. Register the elements in `src/options/scripts/ui.ts`.
3. Add fill logic in `src/options/scripts/utils/fill-helpers/`.
4. Add save logic in `src/options/scripts/utils/save-helpers/`.
5. Wire the new fill/save helpers through `fill-inputs.ts` and `save-config.ts`.
6. If the option needs a parsed or optimized runtime representation, update `src/utils/fast-config.ts` so `save-config.ts` can rebuild `fastConfig`.

## Config vs Fast Config

- `config` is the user-facing stored shape from `src/utils/config.ts`.
- Keep `config` values easy to edit and export.
- Example: `config.hotkeys.mappings`, `config.rules.urls.blacklist`, `config.rules.urls.whitelist`, and `config.hints.directives` are stored as raw strings.
- `config.hotkeys.mappings` must declare every action at least once. Use `<unbound> action-name` when an action should exist in config but not be bound to a key sequence.
- `config.hints.directives` must contain exactly one line for each reserved directive. Use `@directive <unbound>` when a directive should stay declared but have no labels.
- `fastConfig` is the derived runtime shape from `src/utils/fast-config.ts`.
- Keep `fastConfig` values ready for the content script to consume without reparsing on every keydown.
- Example: parsed URL rules, parsed hotkey mappings, hotkey prefixes, and other derived hint settings belong in `fastConfig`.
- `<unbound>` hotkey declarations are validated and preserved in `config`, but they are omitted from `fastConfig.hotkeys.mappings` because they do not create runtime bindings.
- `<unbound>` directive lines are validated and preserved in `config`, but they are normalized to empty label arrays in `fastConfig.hints.directives`.

## Required Wiring When Adding a New Interaction

1. Add the control element to `src/options.html`.
2. Register it in `src/options/scripts/ui.ts`.
3. Add listeners in `src/options/scripts/inputs.ts` or `src/options/scripts/keybinds.ts`.
4. Reuse the toast helpers in `src/options/scripts/utils/sonner.ts` for user feedback.

## Useful Things

- If a control renders but does not persist, check `save-helpers`.
- If a control persists but does not show initial state, check `fill-helpers`.
- If an option saves correctly but the runtime does not react to it, check `buildFastConfig`, the config sync helpers in `src/core/utils/fast-config-sync.ts`, and the runtime listener/setup helpers under `src/core/navigation/`.
- If an element lookup fails, check that its ID matches the suffix helpers in `ui-helpers.ts`.

## Styles

- The options page stylesheet entrypoint is `src/options/styles/index.css`.
- Keep feature-specific style blocks in the closest split stylesheet under `src/options/styles/` instead of growing `index.css` directly.
- Current split files roughly map to feature areas: `base.css`, `rules-editors.css`, `hotkeys.css`, `hints.css`, `color-picker.css`, and `custom-css.css`.
