# Terminology

Use these terms consistently when talking about the extension.

## Core Terms

- `hint mode`: the temporary mode where the page shows selectable hints over interactive elements.
- `hint target`: the underlying DOM element a hint can activate, plus its runtime metadata such as rect, URLs, marker, and assigned label.
- `hintable element`: a DOM element that qualifies to become a hint target after collection and filtering.
- `activation`: the final action taken when a hint target is selected, such as click, focus, open in new tab, or copy.

## Marker Terms

- `marker`: the visible overlay UI rendered for a hint target.
- `marker label`: the text portion of a marker that shows the target's assigned hint characters.
- `marker icon`: the optional inline SVG shown inside a marker for special semantics like expand/collapse or directives.
- `marker variant`: the marker layout/style mode, such as default text-only markers or icon-bearing variants.
- `hint overlay`: the top-level DOM container that holds all rendered hint markers.

## Label Terms

- `label`: the generated character sequence a user types to select a hint target.
- `typed prefix`: the portion of a label the user has already entered while hint mode is active.
- `pending letters`: label characters not yet typed.
- `typed letters`: label characters already matched by the current typed prefix.
- `charset`: the set of characters used to generate hint labels.
- `min label length`: the configured minimum number of characters in generated hint labels.

## Directive Terms

- `directive`: a semantic classification that tries to identify one especially meaningful target on the page, such as `home`.
- `directive detection`: the scoring process that evaluates hintable elements and chooses the best candidate for a directive.
- `directive match`: the current winning candidate for a directive, including its element, score, and target.
- `directive marker`: a marker rendered with a directive-specific icon to signal that the target has special meaning.
- `directive score`: the numeric confidence value used to compare directive candidates during collection.

## Config Terms

- `config`: the user-facing persisted settings shape stored in `chrome.storage.local`.
- `fastConfig`: the parsed runtime cache derived from `config` for fast lookups during navigation.
- `hotkeys.mappings`: the raw editable hotkey declaration list. Every action must appear once or more, and `<unbound>` means declared without a runtime binding.
- `hints.directives`: the raw editable directive declaration list. Every reserved directive must appear exactly once, and `@directive <unbound>` means declared without any labels.
- `reserved hint labels`: the parsed directive label map in runtime config, keyed by directive name, with unbound directives represented as empty arrays.

## Suggested Usage

- Say `hint target` for the interactive thing being acted on.
- Say `marker` for the visible overlay chip.
- Say `label` for the typed characters.
- Say `directive` for semantic target categories like `home`.
- Say `directive marker` when the marker includes a directive icon.
