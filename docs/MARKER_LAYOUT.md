# Marker Layout

This document explains the marker placement system and why it has both generic and special-case layout paths.

## Goal

Marker placement should be readable, stable, and fast.

That sounds simple, but pages contain:

- nav bars
- action bars
- menus
- thumbnail grids
- overlapping overlays
- hidden or hover-only controls

One generic placement strategy does not work well for all of those shapes.

## Main Files

- `src/core/utils/hints/layout.ts`: placement orchestration
- `src/core/utils/hints/layout/placement.ts`: candidate point generation
- `src/core/utils/hints/layout/collision.ts`: collision and occlusion checks
- `src/core/utils/hints/layout/thumbnail.ts`: thumbnail detection and marker sizing decisions
- `src/core/utils/hints/layout/shared.ts`: constants and shared layout helpers

## Design Overview

The layout system has two layers:

- aligned-group placement for UI bars and rows
- generic candidate-based placement for everything else

This split exists because grouped controls look better when their markers share a visual baseline instead of each marker being placed independently.

## Why Special Aligned Placement Exists

Some controls are easier to scan when markers line up:

- navbar items
- response action bars
- top-left aligned control rows
- some horizontal button bars

The code in `layout.ts` detects those clusters first and places them as rows before falling back to generic candidate placement.

That is a deliberate UX choice, not an implementation accident.

## Why Generic Candidate Placement Still Exists

Many targets do not belong to a neat row.

For those targets the system generates candidate positions, then filters them by:

- viewport clamping
- collisions with already placed markers
- occlusion checks against sticky headers, dialogs, and popups

That keeps placement flexible without forcing every site into a few hardcoded layouts.

## Why Thumbnail Layout Is Separate

Thumbnail targets need different behavior because a large media area gives the marker more room and usually reads better when centered or otherwise emphasized.

`layout/thumbnail.ts` handles that logic separately so the rest of the layout code can stay focused on placement rather than media detection.

## Recent Structural Choices

- `layout.ts` now uses shared helpers for aligned-row collection and placement so navbar, action-bar, and similar paths do not each carry their own copy of the same algorithm.
- `layout/types.ts` holds layout-only extracted types so the runtime files can stay focused on behavior.
- The placement pipeline is unified for priming and collision-aware updates, with the main difference controlled by whether a collision grid is active.

## Practical Guidance

If a marker layout bug shows up:

1. Check whether the target should be in an aligned group.
2. Check whether thumbnail heuristics changed the anchor rect.
3. Check candidate generation in `layout/placement.ts`.
4. Check collision or occlusion handling in `layout/collision.ts`.

That order usually isolates the real cause faster than changing candidate positions blindly.
