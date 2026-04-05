export const DEFAULT_HOTKEY_MAPPINGS = `# scroll
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
`.trim();

export const DEFAULT_HINT_CHARSET = "sldkfjeiomwu";

export const DEFAULT_HINT_AVOID_ADJACENT_PAIRS = `# double letters
dd ee ff ii jj kk ll mm oo ss uu ww

# same finger bigrams
sw ws de ed ki ik lo ol jm mj ju uj mu um

# other
ou uo lu ul
`.trim();

export const DEFAULT_HINT_DIRECTIVES = `@input kj kjf kjfd
@erase er
@attach up
@chat ch
@share sh
@download dl
@login si
@microphone mic
@notification nf
@delete dd
@save sv
@copy cp
@hide hi
@home sd sdf sdfj
@sidebar we wer wert
@next kl
@prev lk
@cancel no
@submit ok
@like iu
@dislike oi`;