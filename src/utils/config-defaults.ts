export const DEFAULT_VISUAL_HOTKEY_MAPPINGS = `h visual-left
<left> visual-left
l visual-right
<right> visual-right
j visual-down
<down> visual-down
k visual-up
<up> visual-up
w visual-word-forward
W visual-word-forward
b visual-word-backward
B visual-word-backward
e visual-word-end
) visual-sentence-forward
( visual-sentence-backward
} visual-paragraph-forward
{ visual-paragraph-backward
0 visual-line-start
$ visual-line-end
gg visual-document-start
G visual-document-end
aw visual-select-word
iw visual-select-inner-word
as visual-select-sentence
o visual-reverse
c visual-caret
v visual-character
V visual-line
y visual-yank
<enter> visual-yank
Y visual-yank-line
p visual-open-current-tab
P visual-open-new-tab
/ visual-find
n visual-find-next
N visual-find-prev
<c-e> visual-scroll-down
<c-y> visual-scroll-up`;

export const DEFAULT_HOTKEY_MAPPINGS = `# scroll
j scroll-down
k scroll-up
h scroll-left
l scroll-right
d scroll-half-page-down
u scroll-half-page-up
gg scroll-to-top
G scroll-to-bottom

# hint entry
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

# bar entry
o bar-mode-current-tab
O bar-mode-new-tab
ge bar-mode-edit-current-tab
T bar-mode-tabs

# find entry
/ find-mode

# required find mode
n cycle-match-next
N cycle-match-prev

# watch entry
w watch-mode

# required watch mode
f toggle-fullscreen
e toggle-play-pause
l toggle-loop
m toggle-mute
c toggle-captions
j decrease-speed
k increase-speed

# visual entry
v visual-mode
V visual-line-mode
gv visual-restore

# required visual mode
${DEFAULT_VISUAL_HOTKEY_MAPPINGS}`;

export const DEFAULT_HINT_CHARSET = "sldkfjeiomwu";

export const DEFAULT_HINT_AVOID_ADJACENT_PAIRS = `# double letters
dd ee ff ii jj kk ll mm oo ss uu ww

# same finger bigrams
sw ws de ed ki ik lo ol jm mj ju uj mu um

# other
ou uo lu ul`;

export const DEFAULT_HINT_DIRECTIVES = `@input kj kjf kjfd
@erase er
@attach up
@chat ch
@comment km
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