# Coding Style

Formatting is handled by Prettier on commit. Follow these project-specific rules:

## Core Rules

- Use 2-space indentation.
- Do not use trailing commas.
- Use `camelCase` for variables, functions, and object keys.
- Use `PascalCase` for type aliases and interfaces.
- Keep common acronyms uppercase in identifiers (`UI`, `URL`, `HTML`, `CSS`).

## Config Key Naming

- Use short nested keys under `config`.
- Keep option names aligned with the UI labels.
- Prefer:
  - Wrong: `{ hotkeys: { hotkeyMappings: "..." } }`
  - Right: `{ hotkeys: { mappings: "..." } }`

Useful reference: `src/utils/config.ts`.

If a config value needs parsing or precomputation for runtime use, put the persisted shape in `config` and the derived shape in `fastConfig` (`src/utils/fast-config.ts`).

## TypeScript Patterns

- Keep type fields one per line and end each with `;`.
- Keep narrow helper functions close to the feature that uses them.
- Prefer small feature-specific helpers over large shared abstractions.
- Use `kebab-case` for TypeScript filenames (for example: `is-editable-target.ts`).

Example:

```ts
export type Config = {
  hotkeys: {
    mappings: string;
  };
};
```
