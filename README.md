<div align="center">

<img src="./assets/logo-full.png">

## vim style keyboard navigation for the web

[website](https://nav.maxhu.dev) · [discord](https://maxhu.dev/redirect/discord/nav)

</div>

## info

nav is a browser extension that brings vim style keyboard navigation to the web. It lets you move through pages, jump between tabs, open links with hints, search within the current page, and copy useful URLs or images without reaching for the mouse. It also emphasizes configurability through editable hotkeys, URL-based action rules, and customizable hint generation and styling.

## features

- ⚡️ Fast & Lightweight
- ⌨️ Vim Style Keyboard Navigation
- 🔎 In-Page Find Mode
- 🔗 Link Hints
- 🖼️ Image Hints and Yank Actions
- 📋 Clipboard Actions for Links, Images, and Tab URLs
- 🗂️ Tab and History Navigation
- 🧩 URL-Based Site Rules
- 🎨 Customizable Hint Styling
- 🛠️ Fully Configurable Hotkeys

## keyboard bindings

Modifier keys are specified as `<c-x>`, `<m-x>`, and `<a-x>` for ctrl+x, meta+x, and alt+x respectively. For shift+x and ctrl-shift-x, just type `X` and `<c-X>`.

```text
# scroll
j scroll-down
k scroll-up
h scroll-left
l scroll-right
d scroll-half-page-down
u scroll-half-page-up
gg scroll-to-top
G scroll-to-bottom

# watch
w toggle-video-controls
f toggle-fullscreen # requires watch mode
k toggle-play-pause # requires watch mode

# find
/ enable-find-mode
n cycle-match-next # requires find mode
N cycle-match-prev # requires find mode

# hints
F toggle-hints-new-tab

# tab actions
t create-new-tab
x close-current-tab
r reload-current-tab
R reload-current-tab-hard
J tab-go-prev
K tab-go-next
yt duplicate-current-tab
W move-current-tab-to-new-window

# clipboard
yl yank-link-url
yi yank-image
yI yank-image-url
yy yank-current-tab-url

# history
H history-go-prev
L history-go-next
```

These bindings are fully configurable in the options page.

## contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## setup

See [SETUP.md](./docs/SETUP.md).
