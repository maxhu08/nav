import type { HintDirectiveCases, HintScenarioCase } from "~/tests/types";

export const hintDirectiveCases: HintDirectiveCases = {
  input: {
    desc: "detects input",
    recognizes: ["<input type='text' aria-label='Search' />"],
    ignored: ["<button>Other</button>"]
  },
  attach: {
    desc: "detects attach",
    recognizes: [
      "<input type='file' aria-label='Upload file' />",
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button>",
      "<button type='button' class='toolbar-action icon-paperclip' title='Choose from computer' data-testid='paperclip-button'></button>"
    ],
    ignored: ["<button>Other</button>"]
  },
  home: {
    desc: "detects home",
    recognizes: ["<a href='/' rel='home'>Home</a>"],
    ignored: ["<button>Other</button>"]
  },
  sidebar: {
    desc: "detects sidebar",
    recognizes: [
      "<button aria-label='Open sidebar' aria-controls='left-sidebar'>Menu</button>",
      "<div id='sidebar-header' class='h-header-height flex items-center justify-between'><a data-sidebar-item='true' aria-label='Home' class='text-token-text-primary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50' href='/' data-discover='true'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon-lg'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#55180d' fill='currentColor'></use></svg></a><div class='flex'><button class='text-token-text-tertiary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50 no-draggable cursor-w-resize rtl:cursor-e-resize' aria-expanded='true' aria-controls='stage-slideover-sidebar' aria-label='Close sidebar' data-testid='close-sidebar-button' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' data-rtl-flip='' class='icon max-md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#836f7a' fill='currentColor'></use></svg><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#85f94b' fill='currentColor'></use></svg></button></div></div>"
    ],
    ignored: [
      "<button aria-label='Open profile menu' data-testid='profile-button' class='user-select-none group ps-2 focus:outline-0' type='button' id='radix-_R_2j9muvb8php8t6kcm_' aria-haspopup='menu' aria-expanded='false' data-state='closed'><div class='touch:h-10 touch:w-10 group-keyboard-focused:focus-ring group-hover:bg-token-interactive-bg-secondary-selected flex h-9 w-9 items-center justify-center rounded-full'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon-lg'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#975ff3' fill='currentColor'></use></svg></div></button>"
    ]
  },
  next: {
    desc: "detects next",
    recognizes: [
      "<a href='/next' rel='next'>Next</a>",
      "<ytd-button-renderer button-tooltip-position='left' class='style-scope ytd-shorts' button-renderer='' button-next=''><yt-button-shape><button class='yt-spec-button-shape-next yt-spec-button-shape-next--text yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-xl yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' title='' aria-label='Next video'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'><span class='ytIconWrapperHost' style='width: 24px; height: 24px;'><span class='yt-icon-shape ytSpecIconShapeHost'><div style='width: 100%; height: 100%; display: block; fill: currentcolor;'><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true' style='pointer-events: none; display: inherit; width: 100%; height: 100%;'><path d='M12 3a1 1 0 00-1 1v13.586l-5.293-5.293a1 1 0 10-1.414 1.414L12 21.414l7.707-7.707a1 1 0 10-1.414-1.414L13 17.586V4a1 1 0 00-1-1Z'></path></svg></div></span></span></div><yt-touch-feedback-shape aria-hidden='true' class='yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response yt-spec-touch-feedback-shape--down'><div class='yt-spec-touch-feedback-shape__stroke'></div><div class='yt-spec-touch-feedback-shape__fill'></div></yt-touch-feedback-shape></button></yt-button-shape><tp-yt-paper-tooltip offset='8' role='tooltip' tabindex='-1' aria-label='tooltip' style='left: -96.3333px; top: 3.02083px;'><div id='tooltip' class='style-scope tp-yt-paper-tooltip fade-in-animation' style-target='tooltip'>Next video</div></tp-yt-paper-tooltip></ytd-button-renderer>"
    ],
    ignored: [
      "<button>Other</button>",
      "<ytd-button-renderer id='sign-in-button' class='style-scope ytd-guide-signin-promo-renderer' button-renderer='' button-next=''><yt-button-shape><a href='https://accounts.google.com/ServiceLogin?service=youtube&amp;uilel=3&amp;passive=true&amp;continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den%26next%3Dhttps%253A%252F%252Fwww.youtube.com%252Fshorts%252FiCRUap0AEMQ&amp;hl=en' rel='nofollow' class='yt-spec-button-shape-next yt-spec-button-shape-next--outline yt-spec-button-shape-next--call-to-action yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--enable-backdrop-filter-experiment' aria-haspopup='false' force-new-state='true' aria-label='Sign in' aria-current='false' aria-disabled='false' style=''><div aria-hidden='true' class='yt-spec-button-shape-next__icon'><span class='ytIconWrapperHost' style='width: 24px; height: 24px;'><span class='yt-icon-shape ytSpecIconShapeHost'><div style='width: 100%; height: 100%; display: block; fill: currentcolor;'><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true' style='pointer-events: none; display: inherit; width: 100%; height: 100%;'><path d='M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 016.447 15.276 7 7 0 00-12.895 0A9 9 0 0112 3Zm0 2a4 4 0 100 8 4 4 0 000-8Zm0 2a2 2 0 110 4 2 2 0 010-4Zm-.1 9.001L11.899 16a5 5 0 014.904 3.61A8.96 8.96 0 0112 21a8.96 8.96 0 01-4.804-1.391 5 5 0 014.704-3.608Z'></path></svg></div></span></span></div><div class='yt-spec-button-shape-next__button-text-content'><span class='yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap' role='text' style=''>Sign in</span></div><yt-touch-feedback-shape aria-hidden='true' class='yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response'><div class='yt-spec-touch-feedback-shape__stroke'></div><div class='yt-spec-touch-feedback-shape__fill'></div></yt-touch-feedback-shape></a></yt-button-shape><tp-yt-paper-tooltip offset='8' disable-upgrade=''></tp-yt-paper-tooltip></ytd-button-renderer>"
    ]
  },
  prev: {
    desc: "detects prev",
    recognizes: ["<a href='/prev' rel='prev'>Previous</a>"],
    ignored: ["<button>Other</button>"]
  },
  cancel: {
    desc: "detects cancel",
    recognizes: [
      "<button aria-label='Cancel'>Cancel</button>",
      "<div class='flex-0'><div class='flex flex-col gap-3 sm:flex-row-reverse mt-5 sm:mt-4 flex w-full flex-row-reverse'><button class='btn relative group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-style:solid] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] btn-danger' data-testid='delete-conversation-confirm-button'><div class='flex items-center justify-center'>Delete</div></button><button class='btn relative group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-style:solid] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] btn-secondary'><div class='flex items-center justify-center'>Cancel</div></button></div></div>"
    ],
    ignored: [
      "<button aria-expanded='true' aria-controls='stage-slideover-sidebar' aria-label='Close sidebar' data-testid='close-sidebar-button' data-state='closed'></button>"
    ]
  },
  submit: {
    desc: "detects submit",
    recognizes: [
      "<button type='submit'>Submit</button>",
      "<form><button type='button'>Reply</button></form>",
      "<form><input type='submit' value='Publish' /></form>"
    ],
    ignored: [
      "<button>Other</button>",
      "<div class='flex-0'><div class='flex flex-col gap-3 sm:flex-row-reverse mt-5 sm:mt-4 flex w-full flex-row-reverse'><button class='btn relative group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-style:solid] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] btn-danger' data-testid='delete-conversation-confirm-button'><div class='flex items-center justify-center'>Delete</div></button><button class='btn relative group-focus-within/dialog:focus-visible:[outline-width:1.5px] group-focus-within/dialog:focus-visible:[outline-offset:2.5px] group-focus-within/dialog:focus-visible:[outline-style:solid] group-focus-within/dialog:focus-visible:[outline-color:var(--text-primary)] btn-secondary'><div class='flex items-center justify-center'>Cancel</div></button></div></div>"
    ]
  },
  like: {
    desc: "detects like",
    recognizes: [
      "<button class='yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--segmented-start yt-spec-button-shape-next--enable-backdrop-filter-experiment' title='' aria-pressed='false' aria-label='like this video along with 635,496 other people' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'><yt-icon><span class='yt-icon-shape'><div><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true'><path d='M9.221 1.795a1 1 0 011.109-.656l1.04.173a4 4 0 013.252 4.784L14 9h4.061a3.664 3.664 0 013.576 2.868A3.68 3.68 0 0121 14.85l.02.087A3.815 3.815 0 0120 18.5v.043l-.01.227a2.82 2.82 0 01-.135.663l-.106.282A3.754 3.754 0 0116.295 22h-3.606l-.392-.007a12.002 12.002 0 01-5.223-1.388l-.343-.189-.27-.154a2.005 2.005 0 00-.863-.26l-.13-.004H3.5a1.5 1.5 0 01-1.5-1.5V12.5A1.5 1.5 0 013.5 11h1.79l.157-.013a1 1 0 00.724-.512l.063-.145 2.987-8.535Zm-1.1 9.196A3 3 0 015.29 13H4v4.998h1.468a4 4 0 011.986.528l.27.155.285.157A10 10 0 0012.69 20h3.606c.754 0 1.424-.483 1.663-1.2l.03-.126a.819.819 0 00.012-.131v-.872l.587-.586c.388-.388.577-.927.523-1.465l-.038-.23-.02-.087-.21-.9.55-.744A1.663 1.663 0 0018.061 11H14a2.002 2.002 0 01-1.956-2.418l.623-2.904a2 2 0 00-1.626-2.392l-.21-.035-2.71 7.741Z'></path></svg></div></span></yt-icon></div><div class='yt-spec-button-shape-next__button-text-content'>635K</div></button>",
      "<button class='yt-spec-button-shape-next yt-spec-button-shape-next--segmented-start' aria-pressed='true' aria-label='Unlike this video'>Liked</button>",
      "<div class='yt-spec-button-shape-next yt-spec-button-shape-next--segmented-start'><button aria-pressed='true' aria-label='Unlike this video'>Liked</button></div>",
      "<like-button-view-model class='ytLikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><label class='yt-spec-button-shape-with-label'><button class='yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' aria-pressed='true' aria-label='26,959 likes' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'></div></button><div class='yt-spec-button-shape-with-label__label' aria-hidden='false'><span role='text'>26K</span></div></label></button-view-model></toggle-button-view-model></like-button-view-model>"
    ],
    ignored: ["<button>Other</button>"]
  },
  dislike: {
    desc: "detects dislike",
    recognizes: [
      "<button class='yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--segmented-end yt-spec-button-shape-next--enable-backdrop-filter-experiment' title='' aria-pressed='false' aria-label='Dislike this video' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'><span class='ytIconWrapperHost'><span class='yt-icon-shape'><div><svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' focusable='false' aria-hidden='true'><path d='m11.31 2 .392.007c1.824.06 3.61.534 5.223 1.388l.343.189.27.154c.264.152.56.24.863.26l.13.004H20.5a1.5 1.5 0 011.5 1.5V11.5a1.5 1.5 0 01-1.5 1.5h-1.79l-.158.013a1 1 0 00-.723.512l-.064.145-2.987 8.535a1 1 0 01-1.109.656l-1.04-.174a4 4 0 01-3.251-4.783L10 15H5.938a3.664 3.664 0 01-3.576-2.868A3.682 3.682 0 013 9.15l-.02-.088A3.816 3.816 0 014 5.5v-.043l.008-.227a2.86 2.86 0 01.136-.664l.107-.28A3.754 3.754 0 017.705 2h3.605ZM7.705 4c-.755 0-1.425.483-1.663 1.2l-.032.126a.818.818 0 00-.01.131v.872l-.587.586a1.816 1.816 0 00-.524 1.465l.038.23.02.087.21.9-.55.744a1.686 1.686 0 00-.321 1.18l.029.177c.17.76.844 1.302 1.623 1.302H10a2.002 2.002 0 011.956 2.419l-.623 2.904-.034.208a2.002 2.002 0 001.454 2.139l.206.045.21.035 2.708-7.741A3.001 3.001 0 0118.71 11H20V6.002h-1.47c-.696 0-1.38-.183-1.985-.528l-.27-.155-.285-.157A10.002 10.002 0 0011.31 4H7.705Z'></path></svg></div></span></span></div></button>",
      "<button class='yt-spec-button-shape-next yt-spec-button-shape-next--segmented-end' aria-pressed='true' aria-label='Undo dislike'>Disliked</button>",
      "<div class='yt-spec-button-shape-next yt-spec-button-shape-next--segmented-end'><button aria-pressed='true' aria-label='Undo dislike'>Disliked</button></div>"
    ],
    ignored: ["<button>Other</button>"]
  }
};

export const hintScenarioCases: HintScenarioCase[] = [
  {
    desc: "collects visible native attach button when hit testing misses it",
    fixtures: [
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button>"
    ],
    elementsFromPointSelectors: [],
    expect: {
      hintableSelectors: ["#composer-plus-btn"],
      directiveTargets: {
        attach: "#composer-plus-btn"
      }
    }
  },
  {
    desc: "dedupes overlapping attach wrapper and button targets",
    fixtures: [
      "<div role='button' tabindex='0' aria-label='Add files and more' data-testid='composer-plus-wrapper' data-state='closed'><button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button></div>"
    ],
    geometry: {
      "[data-testid='composer-plus-wrapper']": { left: 18, top: 18, width: 44, height: 44 },
      "[data-testid='composer-plus-btn']": { left: 20, top: 20, width: 40, height: 40 }
    },
    elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
    expect: {
      hintableSelectors: ["[data-testid='composer-plus-btn']"],
      directiveTargets: {
        attach: "[data-testid='composer-plus-btn']"
      }
    }
  },
  {
    desc: "assigns @attach to the most visible overlapping attach control",
    fixtures: [
      "<div role='button' tabindex='0' aria-label='Add files and more' data-testid='composer-plus-wrapper' data-state='closed'></div>",
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'></button>"
    ],
    geometry: {
      "[data-testid='composer-plus-wrapper']": { left: 20, top: 20, width: 40, height: 40 },
      "[data-testid='composer-plus-btn']": { left: 20, top: 20, width: 40, height: 40 }
    },
    elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
    expect: {
      directiveTargets: {
        attach: "[data-testid='composer-plus-btn']"
      }
    }
  },
  {
    desc: "prefers visible attach button over nearby sr-only file input",
    fixtures: [
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'></button>",
      "<input type='file' id='upload-photos' class='sr-only select-none' />"
    ],
    geometry: {
      "[data-testid='composer-plus-btn']": { left: 376, top: 384, width: 36, height: 36 },
      "#upload-photos": { left: 364, top: 430, width: 1, height: 1 }
    },
    elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
    expect: {
      directiveTargets: {
        attach: "[data-testid='composer-plus-btn']"
      }
    }
  },
  {
    desc: "suppresses overlapping generic hints when @attach is assigned",
    fixtures: [
      "<div role='button' tabindex='0' aria-label='Add files and more' data-testid='composer-plus-wrapper' data-state='closed'></div>",
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'></button>",
      "<div role='button' tabindex='0' aria-label='Open uploader menu' data-testid='composer-plus-generic'></div>"
    ],
    geometry: {
      "[data-testid='composer-plus-wrapper']": { left: 18, top: 18, width: 48, height: 48 },
      "[data-testid='composer-plus-btn']": { left: 20, top: 20, width: 40, height: 40 },
      "[data-testid='composer-plus-generic']": { left: 16, top: 16, width: 24, height: 24 }
    },
    elementsFromPointSelectors: ["[data-testid='composer-plus-btn']"],
    reservedLabels: {
      attach: ["up"]
    },
    expect: {
      assignedTargets: [
        {
          selector: "[data-testid='composer-plus-btn']",
          directive: "attach"
        }
      ]
    }
  },
  {
    desc: "skips hints for intrinsic controls fully covered by another element",
    fixtures: [
      "<button id='covered-action' type='button' aria-label='Covered action'>Covered action</button>",
      "<div id='sticky-navbar-cover' aria-hidden='true'></div>"
    ],
    geometry: {
      "#covered-action": { left: 24, top: 24, width: 120, height: 40 },
      "#sticky-navbar-cover": { left: 24, top: 24, width: 120, height: 40 }
    },
    expect: {
      hintableSelectors: []
    }
  },
  {
    desc: "keeps @like on pressed youtube like button nested in view-model wrappers",
    fixtures: [
      "<like-button-view-model class='ytLikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><label class='yt-spec-button-shape-with-label'><button id='pressed-like-button' class='yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' aria-pressed='true' aria-label='26,959 likes' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'></div></button><div class='yt-spec-button-shape-with-label__label' aria-hidden='false'><span role='text'>26K</span></div></label></button-view-model></toggle-button-view-model></like-button-view-model>",
      "<dislike-button-view-model class='ytDislikeButtonViewModelHost ytwReelActionBarViewModelHostDesktopActionButton'><toggle-button-view-model><button-view-model class='ytSpecButtonViewModelHost'><label class='yt-spec-button-shape-with-label'><button id='pressed-dislike-button' class='yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--enable-backdrop-filter-experiment' aria-pressed='false' aria-label='Dislike this video' aria-disabled='false'><div aria-hidden='true' class='yt-spec-button-shape-next__icon'></div></button></label></button-view-model></toggle-button-view-model></dislike-button-view-model>"
    ],
    expect: {
      directiveTargets: {
        like: "#pressed-like-button",
        dislike: "#pressed-dislike-button"
      }
    }
  }
];