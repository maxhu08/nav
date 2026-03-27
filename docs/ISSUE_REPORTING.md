# Issue Reporting

Use this page when reporting hint or target-selection bugs.

## Keep It Simple

- Say what you expected and what happened instead.
- Add short reproduction steps if you can.
- If you think config affects it, attach the relevant config.
- If a screenshot or recording would help, attach that too.

## Copy-Paste Template

````md
## Summary

Short description of the issue.

## Environment

- Browser:
- nav version:
- URL:

## Action

- Action triggered:
- Typed keys (if any):

## Expected

- What should happen?

## Actual

- What happened instead?

## Reproduction Steps

1.
2.
3.

## Config (if relevant)

```txt
Paste any config that might affect the issue.
```

## Extra Context

- Screenshot / recording:
- Anything else that might help:
````

## Filled Example

````md
## Summary

Hint mode misses the visible composer button.

## Environment

- Browser: Firefox 145
- nav version: 1.0.7
- URL: https://example.com/messages

## Action

- Action triggered: `hint-mode-current-tab`
- Typed keys: `as`

## Expected

- nav should target the visible composer button in the toolbar.

## Actual

- nav skips the visible toolbar button and highlights a different control.

## Reproduction Steps

1. Open the page.
2. Focus the message composer.
3. Trigger hint mode.
4. Type the displayed hint label.

## Config (if relevant)

```txt
hints.charset: asdfjkl
```

## Extra Context

- Screenshot or recording: attached
- Anything else that might help: the visible button only appears after hover.
````
