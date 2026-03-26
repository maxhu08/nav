# Hints Architecture

This document explains the hints system at a design level.

## Purpose

The hints feature has to do three things well at the same time:

- find good targets across many kinds of pages
- stay responsive while scanning and updating the DOM
- remain debuggable when a site-specific failure shows up

That is why the implementation is split into explicit stages instead of one large pass.

## High-Level Flow

1. Collect possible targets.
2. Dedupe and order them.
3. Detect reserved directive targets such as `@input` or `@attach`.
4. Assign reserved labels.
5. Generate the rest of the labels.
6. Build marker models and DOM nodes.
7. Place markers.
8. Filter by typed input and activate the chosen result.

The important design choice is that each stage works on a narrower problem than the previous one. That makes the heuristics easier to reason about and keeps changes localized.

## Main Modules

- `src/core/actions/hints.ts`: feature entrypoint.
- `src/core/actions/hints/controller.ts`: session lifecycle, activation, cleanup.
- `src/core/utils/hints/hint-recognition/`: collection, dedupe, reveal behavior.
- `src/core/utils/hints/directive-recognition/`: reserved-target scoring and selection.
- `src/core/utils/hints/pipeline.ts`: label assignment orchestration.
- `src/core/utils/hints/markers.ts`: marker model and DOM updates.
- `src/core/utils/hints/layout.ts`: marker placement orchestration.
- `src/core/utils/hints/renderer.ts`: overlay and styles.

## Why The Pipeline Is Split

- Collection is expensive because it touches the DOM broadly.
- Directive recognition is expensive because it applies many heuristics to each candidate.
- Layout is expensive because it mixes geometry, viewport limits, and collision handling.

Keeping those stages separate makes it possible to cache aggressively inside a stage without coupling unrelated logic together.

## Key Design Decisions

- `hint-recognition/collection.ts` computes search roots once per pass so shadow DOM traversal is not repeated unnecessarily.
- `dom/visibility.ts` treats ancestor visual visibility separately from target clickability so overlay containers with `pointer-events: none` do not hide interactive descendants that still receive events.
- `directive-recognition/` uses a shared feature cache so text joins, closest lookups, and rect reads can be reused across many directives.
- `pipeline.ts` and `semantics.ts` share directive results instead of rescanning the same targets.
- `controller.ts` and `pipeline.ts` cooperate on a per-page stable-label cache for expand/collapse focus hints so the same toggle can keep the same key sequence across repeated hint activations.
- `layout.ts` keeps special aligned-row placement as a separate concept because pages often present controls in bars, menus, or nav rows where generic placement looks worse.

## Why The Heuristics Are Not Fully Declarative

The codebase uses some shared helpers, but the system is not driven by a giant JSON-like rule table.

That is intentional.

- Many decisions depend on DOM structure, not just text matches.
- Some directives need vetoes and remaps, not just scoring.
- Different sites express the same UI pattern in very different markup.

So the system keeps directive-specific code where that helps correctness, while sharing the repetitive score-building parts.

## What To Read Next

- `docs/DIRECTIVE_RECOGNITION.md`
- `docs/MARKER_LAYOUT.md`
- `docs/PROJECT_STRUCTURE.md`
