# Directive Recognition

This document explains how reserved hint directives are chosen and why the implementation is structured the way it is.

## Goal

Reserved directives such as `@input`, `@attach`, `@home`, and `@sidebar` should land on the control a user most likely means, even when a page has many similar controls nearby.

## Current Pipeline

The public facade is `src/core/utils/hints/directive-recognition.ts`.

Internally it now runs three steps:

1. Candidate generation in `src/core/utils/hints/directive-recognition/candidate-generation.ts`
2. Winner selection in `src/core/utils/hints/directive-recognition/winner-selection.ts`
3. Post-selection remapping in `src/core/utils/hints/directive-recognition/post-selection.ts`

The registry lives in `src/core/utils/hints/directive-recognition/definitions.ts`.

## Why Split Candidate Generation From Selection

Older versions mixed feature caching, score calculation, threshold comparison, and remapping in one place.

The current split exists so that:

- feature extraction happens once per element
- every directive can score against the same cached context
- winner selection is a simple threshold-and-best-score pass
- post-selection tweaks stay isolated from the main scorer logic

That separation makes it easier to debug whether a failure came from scoring, thresholding, or presentation remapping.

## Shared Feature Cache

`candidate-generation.ts` creates a shared feature resolver for each recognition pass.

That cache holds values like:

- bounding rects
- whether the element is selectable
- joined attribute text
- `closest(...)` lookups

This matters because the same target may be inspected by many directive scorers in one pass.

## Shared Scoring Helpers

The shared scoring helpers live in `src/core/utils/hints/directive-recognition/scoring.ts`.

They are used to normalize repeated score math such as:

- base scores
- strong-signal tracking
- width and height bonuses
- area penalties

The design intentionally stops there.

The project does not try to force every directive into one declarative schema because many scorers need custom DOM logic and site-agnostic structural checks.

## Why Some Directives Still Need Post-Selection Remaps

The raw highest-scoring candidate is not always the best element to show a marker on.

Two common examples:

- `attach`: the strongest semantic match may be a hidden file input, while the visible proxy button is the better marker target
- `sidebar`: the semantic winner may need to be remapped to the control that best represents the sidebar toggle visually

That is why remapping is a separate post-pass instead of being embedded into the scorer itself.

## Module Responsibilities

- `definitions.ts`: directive order and thresholds
- `candidate-generation.ts`: score all directives for all elements using shared caches
- `winner-selection.ts`: choose best indexes using registry thresholds and stable iteration order
- `post-selection.ts`: remap presentation-sensitive winners
- `geometry.ts`: overlap and proximity helpers used by more than one scorer family
- `shared.ts`: text, attribute, and DOM helper utilities
- `action-directives.ts`: action-like directives
- `input-attach.ts`: input and attach heuristics
- `home-sidebar.ts`: home and sidebar heuristics

## Important Behavior Constraints

Some behavior is intentionally preserved because tests and user expectations depend on it.

- Thresholds are still directive-specific.
- Directive order still matters when comparing winners.
- Candidate ties still rely on the existing best-score pass semantics.
- Single-selectable-field override for `@input` still happens after candidate generation.
- `attach` and `sidebar` still remap after the initial winner is chosen.

## Practical Guidance

When adding or changing a directive:

1. Put registry wiring in `definitions.ts`.
2. Keep custom heuristics in the closest scorer file.
3. Prefer shared scoring helpers for repeated math, not for the whole logic.
4. Add focused tests under `tests/directives/` and `tests/hints/`.

If you are unsure where to start, read the scorer nearest to the directive family you are changing before touching the facade.
