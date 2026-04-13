## Style Guide

This repo prefers small, direct Bun and TypeScript code. Keep changes minimal and aligned with the patterns already used here.

### General Principles

- Keep logic in one function unless extracting it clearly improves reuse or composition
- Avoid `try`/`catch` unless there is a real recovery path
- Avoid `any`
- Prefer single-word variable names when they still read clearly
- Use Bun APIs when practical. Prefer `Bun.file()` for straightforward file reads, and use `node:fs` for broader filesystem work like copying, writing, removing, or traversing directories
- Rely on type inference; add explicit annotations or interfaces only when exports or readability need them
- Prefer functional array methods like `flatMap`, `filter`, and `map` over loops; when filtering, use type guards so downstream inference stays precise

Inline values that are only used once to keep variable count low.

```ts
// Good
const version = (await Bun.file(resolve(ROOT, "EXTENSION_VERSION.txt")).text()).trim();

// Bad
const versionFile = resolve(ROOT, "EXTENSION_VERSION.txt");
const version = (await Bun.file(versionFile).text()).trim();
```

### Destructuring

Avoid object destructuring unless it clearly improves readability. Prefer dot notation so object context stays visible.

This applies to local assignments, function parameters, callback parameters, and values returned from helpers. Default to `obj.x` over pulling properties into standalone names.

```ts
// Good
obj.a;
obj.b;

function render(user) {
  return user.name;
}

items.map((item) => item.id);

// Bad
const { a, b } = obj;

function render({ name }) {
  return name;
}

items.map(({ id }) => id);
```

### Variables

Prefer `const` over `let`. Use ternaries or early returns instead of reassigning values.

```ts
// Good
const foo = condition ? 1 : 2;

// Bad
let foo;
if (condition) foo = 1;
else foo = 2;
```

### Control Flow

Prefer early returns when one branch exits immediately. Keep direct `if`/`else` blocks when they express one paired decision more clearly than split `if` statements.

```ts
// Good
function foo() {
  if (condition) return 1;
  return 2;
}

function bar(condition) {
  if (condition) {
    doThing();
  } else {
    doOtherThing();
  }
}

// Bad
function foo() {
  if (condition) return 1;
  else return 2;
}

function bar(condition) {
  if (condition) {
    doThing();
  }
  if (!condition) {
    doOtherThing();
  }
}
```

## Testing

- Avoid mocks when possible
- Test the real implementation instead of duplicating production logic in tests

## Type Checking

- Always run `bun typecheck`; do not run `tsc` directly

## Check

Run `bun check` after every change.
