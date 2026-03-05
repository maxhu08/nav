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

Navigating the current page:

```text
h       scroll left
j       scroll down
l       scroll right
gg      scroll to top of the page
G       scroll to bottom of the page
d       scroll down half a page
u       scroll up half a page
F       open a hinted link in a new tab
r       reload the current page
R       hard reload the current page
```

Watch controls:

```text
w       focus the active video and show watch hints
f       while watch mode is active, toggle fullscreen for the active video
k       while watch mode is active, pause the active video
```

After triggering fullscreen or pause from watch mode, watch mode closes automatically.

Using find:

```text
/       enter find mode
n       cycle forward to the next find match
N       cycle backward to the previous find match
```

Clipboard actions:

```text
yl      copy a hinted link URL
yi      copy a hinted image
yI      copy a hinted image URL
yy      copy the current tab URL
```

Navigating your history:

```text
H       go back in history
L       go forward in history
```

Manipulating tabs:

```text
J       go one tab left
K       go one tab right
t       create a new tab
x       close the current tab
yt      duplicate the current tab
W       move the current tab to a new window
```

These bindings are fully configurable in the options page.

## contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## setup

See [SETUP.md](./docs/SETUP.md).
