<div align="center">

<img src="./assets/logo-full.png">

## vim style keyboard navigation for the web

[website](https://nav.maxhu.dev) · [discord](https://maxhu.dev/redirect/discord/nav)

</div>

## info

nav is a browser extension that brings vim style keyboard navigation to the web. It lets you move through pages, jump between tabs, open links with hints, search within the current page, and copy useful URLs or images without reaching for the mouse. It also emphasizes configurability through editable hotkeys, URL-based action rules, and customizable hint generation and styling.

## download

Chromium-based browsers (Chrome, Brave, Opera)

[<img src="./assets/download/download-chrome.svg" height="53" alt="Chromium Download">](https://chromewebstore.google.com/detail/nav/dlcpodncoklccfalllombmocfaonlhhg)

Firefox-based browsers (Firefox, Floorp, Zen)

[<img src="./assets/download/download-firefox.svg" height="53" alt="Firefox Download">](https://addons.mozilla.org/en-US/firefox/addon/nav-extension)

Microsoft Edge

Coming soon

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

Common default keybinds:

Navigating the Current Page:
`h` scroll left
`j` scroll down
`k` scroll up
`l` scroll right
`gg` scroll to top of page
`G` scroll to bottom of page
`d` scroll down half a page
`u` scroll up half a page

Using Hints:
`f` open hinted target in current tab
`F` open hinted target in new tab

Tab Actions:
`t` create new tab
`x` close current tab
`r` reload page
`R` hard reload page
`J` focus tab to the left
`K` focus tab to the right
`yt` duplicate current tab
`W` move current tab to a new window

Clipboard Actions:
`yl` copy hinted link URL
`yi` copy hinted image
`yI` copy hinted image URL
`yy` copy current tab URL

History and Pagination:
`H` go back in history
`L` go forward in history
`[` follow previous page link
`]` follow next page link

Find Mode:
`/` enter find mode
`n` next match
`N` previous match

Watch Mode:
`w` enter watch mode
`f` toggle fullscreen
`e` toggle play/pause
`l` toggle loop
`m` toggle mute
`c` toggle captions

Modifier keys are specified as `<c-x>`, `<m-x>`, and `<a-x>` for ctrl+x, meta+x, and alt+x respectively. For shift+x and ctrl-shift-x, just type `X` and `<c-X>`.

Full default mappings:

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

# hints
f hint-mode-current-tab
F hint-mode-new-tab
<a-f> hint-mode-right-click

# tab actions
t create-new-tab
x close-current-tab
<unbound> close-tabs-other
<unbound> close-tabs-left
<unbound> close-tabs-right
r reload-current-tab
R reload-current-tab-hard
J tab-go-prev
K tab-go-next
g0 first-tab
g$ last-tab
<chevronleft><chevronleft> move-tab-left
<chevronright><chevronright> move-tab-right
X restore-closed-tab
^ visit-previous-tab
yt duplicate-current-tab
yo duplicate-current-tab-origin
W move-current-tab-to-new-window

# clipboard
yl yank-link-url
yi yank-image
yI yank-image-url
yy yank-current-tab-url
yc yank-current-tab-url-clean

# misc
H history-go-prev
L history-go-next
[ follow-prev
] follow-next

# bar
o bar-mode-current-tab
O bar-mode-new-tab
ge bar-mode-edit-current-tab

# find
/ find-mode
n cycle-match-next # requires find mode
N cycle-match-prev # requires find mode

# watch
w watch-mode
f toggle-fullscreen # requires watch mode
e toggle-play-pause # requires watch mode
l toggle-loop # requires watch mode
m toggle-mute # requires watch mode
c toggle-captions # requires watch mode
```

## star-history

[![Star History Chart](https://api.star-history.com/svg?repos=maxhu08/nav&type=Date)](https://star-history.com/#maxhu08/nav&Date)

## contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## setup

See [SETUP.md](./docs/SETUP.md).
