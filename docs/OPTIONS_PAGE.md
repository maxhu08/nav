# Options Page

This page covers the minimum conventions required to add new options safely.

## Naming Rules

- Config section names come from config keys.
- Textarea helpers use the suffix pattern:
  - Container: `feature-name-container`
  - Textarea: `feature-name-textarea`
- Button helpers use the suffix pattern:
  - Button: `action-name-button`

Example:

- Config key: `hotkeys.mappings`
- Container ID: `hotkeys-mappings-container`
- Textarea ID: `hotkeys-mappings-textarea`
- Save button ID: `save-config-button`

## Required Wiring When Adding a New Input

1. Add the input markup to `src/options.html` with IDs that match the helper naming rules.
2. Register the elements in `src/options/scripts/ui.ts`.
3. Add fill logic in `src/options/scripts/utils/fill-helpers/`.
4. Add save logic in `src/options/scripts/utils/save-helpers/`.
5. Wire the new fill/save helpers through `fill-inputs.ts` and `save-config.ts`.

## Required Wiring When Adding a New Interaction

1. Add the control element to `src/options.html`.
2. Register it in `src/options/scripts/ui.ts`.
3. Add listeners in `src/options/scripts/inputs.ts` or `src/options/scripts/keybinds.ts`.
4. Reuse the toast helpers in `src/options/scripts/utils/sonner.ts` for user feedback.

## Useful Things

- If a control renders but does not persist, check `save-helpers`.
- If a control persists but does not show initial state, check `fill-helpers`.
- If an element lookup fails, check that its ID matches the suffix helpers in `ui-helpers.ts`.
