# Adding Actions

Use this checklist when you add a new action to nav.

## Start With the Contract

Define these three things first:

1. Action name, such as `my-new-action`
2. Default hotkey, such as `abc`
3. Exact behavior, written in one sentence

If the action changes an existing behavior, decide whether the old action name should keep working in migrated configs.

## 1. Add the Runtime Action

- Put the implementation in the closest runtime module under `src/core/actions/`
- If it is a simple tab-management action, it may go through `src/core/actions/tabs.ts` and `src/background.ts`
- If it is a page action, add it to the relevant feature module such as `src/core/actions/yank.ts`, `src/core/actions/find.ts`, or `src/core/actions/watch-mode.ts`
- Register the action in `src/core/navigation.ts`
- Add the action name to `ActionName` and `VALID_ACTION_NAMES` in `src/utils/hotkeys.ts`

## 2. Update the Default Config

Default hotkeys come from `src/utils/hotkeys.ts` in `DEFAULT_HOTKEY_MAPPINGS`.

- Add the new default mapping in the correct section of `DEFAULT_HOTKEY_MAPPINGS`
- Keep the list grouped consistently with nearby actions
- `src/utils/config.ts` already pulls `DEFAULT_HOTKEY_MAPPINGS` into `defaultConfig`, so you usually do not need a second edit there unless the config shape changes

## 3. Update Migration Logic

Before editing migration logic, check the current release version in `EXTENSION_VERSION.txt`.

- Use that version to decide the migration comment in `src/utils/migrate-config.ts`
- Add migration logic for the new hotkey if older saved configs would otherwise miss it
- If you renamed an existing action, migrate the old action name to the new one too
- Keep the migration comment in the existing style, such as `// if config before vX.X.X`

The goal is that a user with an older saved config still gets the new action or renamed action after loading the updated extension.

## 4. Update the Docs Page

Edit `src/docs.html` and update both places:

- The action-name list near `action.names.normal`
- The detailed description entry for the action

Keep the wording user-facing and describe what the action does, not how it is implemented.

## 5. Copy the New Default Mapping Into the README

Edit the keyboard bindings block in `README.md` so it matches `DEFAULT_HOTKEY_MAPPINGS` in `src/utils/hotkeys.ts`.

- Add the new hotkey in the correct section
- If you changed or removed an older binding, reflect that in `README.md` too
- If the action needs a short note, add one below the code block near the other action explanations

## 6. Add or Update Tests

- Add migration coverage in `tests/config.test.ts` when default mappings or renamed actions need backward compatibility
- Add focused tests for any new URL or helper behavior in the relevant test file under `tests/`
- Run `bun test tests/config.test.ts`
- Run `bun run typecheck`

## Quick File Checklist

- `src/core/actions/...`
- `src/core/navigation.ts`
- `src/utils/hotkeys.ts`
- `src/utils/migrate-config.ts`
- `src/docs.html`
- `README.md`
- `tests/config.test.ts`

If the action touches tabs or browser APIs, also check `src/background.ts`.
