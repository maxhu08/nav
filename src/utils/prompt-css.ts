const promptCSS = `/* :scope is the prompt (or the Find next/previous widget). */
:scope {
  width: min(var(--nav-prompt-width), calc(100vw - 32px));
  border: 2px solid var(--nav-prompt-color);
  border-radius: .5rem;
  background: #171717;
  box-shadow: 0 20px 40px rgba(0, 0, 0, .35);
  color: #f5f5f5;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: calc(var(--nav-prompt-text-size) * var(--nav-prompt-font-scale));
  line-height: 1.333333;
}

:scope::selection, *::selection {
  background: #ffffff20 !important;
  color: inherit !important;
}

.nav-find-icon {
  width: 3em;
  height: 2.333333em;
  color: #a1a1aa;
}

.nav-find-icon svg, .nav-find-suggestion-icon svg {
  width: 1em;
  height: 1em;
}

#nav-find-input {
  padding: .5em 0;
  color: #fafafa;
}

#nav-find-input[data-url-like="true"] {
  color: var(--nav-bar-url-color);
}

#nav-find-input::placeholder { color: #a1a1aa; }

#nav-find-match-count {
  color: #a1a1aa;
  padding-left: .166667em;
}

.nav-find-bar-actions {
  gap: .333333em;
  height: 2.333333em;
  padding: 0 .5em;
}

#nav-find-suggestions { padding-top: .166667em; }
.nav-find-suggestion { color: #a1a1aa; }

.nav-find-suggestion:hover, .nav-find-suggestion[data-selected="true"] {
  background: rgba(255, 255, 255, .08);
}

.nav-find-suggestion:focus-visible, .nav-find-nav:focus-visible {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, .18);
}

.nav-find-suggestion-icon {
  width: 3em;
  height: 2.333333em;
  color: #a1a1aa;
}

.nav-find-suggestion-value { padding: .5em .5em .5em 0; }
.nav-find-suggestion-char { color: #737373; }
.nav-find-suggestion-char[data-match="true"] { color: #fafafa; }

.nav-find-suggestion[data-direct-link="true"] .nav-find-suggestion-char[data-match="true"] {
  color: var(--nav-bar-url-color);
}

.nav-find-nav {
  width: 36px;
  height: 36px;
  border-radius: .4rem;
  color: #fafafa;
  transition: background-color .15s ease, color .15s ease, opacity .15s ease;
}

.nav-find-nav:hover:not(:disabled) { background: rgba(255, 255, 255, .08); }
.nav-find-nav:disabled { opacity: .35; }
.nav-find-nav svg { width: 18px; height: 18px; }
.nav-find-clear { width: 1.5em; height: 1.5em; border-radius: .266667em; }
.nav-find-clear svg { width: 1em; height: 1em; }`;

export const DEFAULT_BAR_CUSTOM_CSS = promptCSS;

export const DEFAULT_FIND_CUSTOM_CSS = `${promptCSS}

/* These colors also style matches in the webpage. */
:scope {
  --nav-find-match-background: color-mix(in srgb, var(--nav-find-color) 35%, transparent);
  --nav-find-current-match-background: var(--nav-find-color);
  --nav-find-match-color: #000000;
}

:scope#nav-find-status {
  width: auto;
  gap: .5rem;
  padding: 10px 12px;
  font-size: 20px;
  line-height: 28px;
}

#nav-find-status-text {
  color: #fafafa;
  font-size: 20px;
  line-height: 28px;
}

.nav-find-status-number { color: #fafafa; }
.nav-find-status-separator { color: #a1a1aa; }`;