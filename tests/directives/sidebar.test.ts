import { describe, test } from "bun:test";
import { runDirectiveCase } from "~/tests/helpers/hint-directive";
import { runHintScenarioCase } from "~/tests/helpers/hint-scenario";
import type { DirectiveTestCase } from "~/tests/types";

const faceplateHamburgerOuterHtml =
  "<faceplate-tracker source='nav' action='open' noun='hamburger_menu' class='relative nd:visible'><activate-feature name='HamburgerMenu_nwYSWB' activation='intent'><button rpl='' class='m:hidden button-medium px-[calc(var(--rem12)-var(--button-border-width,0px))] button-plain icon items-center justify-center button inline-flex' id='navbar-menu-button' type='button'><span class='flex items-center justify-center'><span class='flex'><svg rpl='' fill='currentColor' height='20' icon-name='menu' viewBox='0 0 20 20' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M17.1 4.801H2.9a.9.9 0 010-1.8h14.199a.9.9 0 01.001 1.8zM18 10a.9.9 0 00-.9-.9H2.9a.9.9 0 000 1.8h14.199A.9.9 0 0018 10zm0 6.1a.9.9 0 00-.9-.9H2.9a.9.9 0 000 1.8h14.199a.9.9 0 00.901-.9z'></path></svg></span></span><faceplate-screen-reader-content>Open menu</faceplate-screen-reader-content></button></activate-feature><faceplate-loader name='DevvitLeftNavBadge_ljsxvx' src='concat:CfyJ7ebIiI,Dt1LUNWYc5,CBrh6z96pb,DqKZI2SLMU' loading='lazy' data-prefix='en-US/'></faceplate-loader><div data-feature='devvit-left-nav-badge' class='h-[40px] absolute top-0 end-0'><games-section-badge-wrapper appearance='badge' featured-game-slug='battlebirds-app' class='m:hidden' badgeallowed=''></games-section-badge-wrapper></div></faceplate-tracker>";

const collapseNavigationButtonOuterHtml = `<button rpl="" class="bg-neutral-background shadow-xs
button-small px-[calc(var(--rem10)-var(--button-border-width,0px))]
button-bordered


icon
items-center justify-center
button inline-flex " id="flex-nav-collapse-button">
      <span class="flex items-center justify-center">
      <span class="flex"><svg rpl="" fill="currentColor" height="16" icon-name="menu" viewBox="0 0 20 20" width="16" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.1 4.801H2.9a.9.9 0 010-1.8h14.199a.9.9 0 01.001 1.8zM18 10a.9.9 0 00-.9-.9H2.9a.9.9 0 000 1.8h14.199A.9.9 0 0018 10zm0 6.1a.9.9 0 00-.9-.9H2.9a.9.9 0 000 1.8h14.199a.9.9 0 00.901-.9z"></path>
    </svg></span>
      
    </span>
    <faceplate-screen-reader-content>Collapse Navigation</faceplate-screen-reader-content>
    </button>`;

const userDrawerMenuOuterHtml =
  "<activate-feature name='UserDrawerMenu' query-params='{&quot;subredditPath&quot;:&quot;/r/example/&quot;}' activation='intent'><button rpl='' class='max-w-[40px] button-medium px-[calc(var(--rem12)-var(--button-border-width,0px))] button-plain icon items-center justify-center button inline-flex' id='expand-user-drawer-button' slot='trigger' type='button' aria-haspopup='menu' aria-expanded='false'><span class='flex items-center justify-center'><span class='flex'><div class='max-h-xl'><faceplate-partial id='user-drawer-avatar-logged-in' loading='eager' render-mode='contents' src='/svc/shreddit/user-drawer-button-logged-in' style='display: contents;' data-persistent=''><span class='inline-flex items-center justify-center w-[2rem] h-[2rem]' rpl='' avatar='' flip=''><span class='inline-flex snoovatar relative fp-avatar-container rounded-full w-[2rem] h-[2rem] min-w-[2rem] min-h-[2rem] isolate box-content'><span class='absolute start-0 end-0 bottom-0 mx-auto inline-flex shrink-0 justify-center box-border h-full w-full'><span class='rounded-full absolute h-full w-full inline-flex justify-center bg-[image:var(--color-avatar-gradient)]'></span><svg viewBox='0 0 121 122' xmlns='http://www.w3.org/2000/svg' class='overflow-hidden absolute bottom-0 w-[2rem] h-[2rem]'><defs><clipPath id='avatar-mask'><path d='M0 0V79L28.1628 105.5C35.013 115.465 46.4934 122 59.5 122C72.5066 122 83.987 115.465 90.8372 105.5L120.5 79V0H0Z'></path></clipPath></defs><image href='https://example.com/avatar.png' alt='User Avatar' clip-path='url(#avatar-mask)' height='100%' width='100%'></image></svg></span><span class='bg-online flex absolute bottom-0 rounded-full border-solid border-neutral-background bg-neutral-background right-[0.10rem] border w-[.375rem] h-[.375rem] border-2'></span></span></span></faceplate-partial></div></span></span><faceplate-screen-reader-content>Expand user menu</faceplate-screen-reader-content></button></activate-feature>";

export const directiveTestCase: DirectiveTestCase = {
  desc: "detects sidebar toggle controls while ignoring non-sidebar menus",
  test: {
    recognizes: [
      "<button aria-label='Open sidebar' aria-controls='left-sidebar'>Menu</button>",
      "<div id='sidebar-header' class='h-header-height flex items-center justify-between'><a data-sidebar-item='true' aria-label='Home' class='text-token-text-primary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50' href='/' data-discover='true'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon-lg'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#55180d' fill='currentColor'></use></svg></a><div class='flex'><button class='text-token-text-tertiary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50 no-draggable cursor-w-resize rtl:cursor-e-resize' aria-expanded='true' aria-controls='stage-slideover-sidebar' aria-label='Close sidebar' data-testid='close-sidebar-button' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' data-rtl-flip='' class='icon max-md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#836f7a' fill='currentColor'></use></svg><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon md:hidden'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#85f94b' fill='currentColor'></use></svg></button></div></div>",
      faceplateHamburgerOuterHtml
    ],
    ignores: [
      "<button aria-label='Open profile menu' data-testid='profile-button' class='user-select-none group ps-2 focus:outline-0' type='button' id='radix-_R_2j9muvb8php8t6kcm_' aria-haspopup='menu' aria-expanded='false' data-state='closed'><div class='touch:h-10 touch:w-10 group-keyboard-focused:focus-ring group-hover:bg-token-interactive-bg-secondary-selected flex h-9 w-9 items-center justify-center rounded-full'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon-lg'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#975ff3' fill='currentColor'></use></svg></div></button>",
      userDrawerMenuOuterHtml
    ]
  }
};

describe("sidebar directive", () => {
  test(directiveTestCase.desc, () => {
    runDirectiveCase("sidebar", directiveTestCase.test);
  });

  test("recognizes nested hamburger controls wrapped by tracker-style ancestors", () => {
    runDirectiveCase("sidebar", {
      recognizes: [faceplateHamburgerOuterHtml],
      ignores: [
        "<button aria-label='Open profile menu' data-testid='profile-button' type='button' aria-haspopup='menu' aria-expanded='false'></button>"
      ]
    });
  });

  test("recognizes collapse navigation buttons as sidebar controls", () => {
    runDirectiveCase("sidebar", {
      recognizes: [collapseNavigationButtonOuterHtml],
      ignores: [
        "<button aria-label='Open profile menu' data-testid='profile-button' type='button' aria-haspopup='menu' aria-expanded='false'></button>"
      ]
    });
  });

  test("prefers collapse navigation controls over generic menu and actions triggers", () => {
    runDirectiveCase("sidebar", {
      recognizes: [collapseNavigationButtonOuterHtml],
      ignores: [
        "<button aria-label='Open menu' type='button' aria-haspopup='menu' aria-expanded='false'></button>",
        "<button aria-label='More actions' type='button' aria-haspopup='menu' aria-expanded='false'></button>",
        "<button aria-label='Open item actions' type='button' aria-haspopup='menu' aria-expanded='false'></button>",
        userDrawerMenuOuterHtml
      ]
    });
  });

  test("prefers the actual sidebar button over an overlapping wrapper", () => {
    runHintScenarioCase({
      fixtures: [
        "<div role='button' tabindex='0' aria-label='Collapse Navigation' data-testid='sidebar-wrapper'><button id='flex-nav-collapse-button' type='button' aria-label='Collapse Navigation'><svg aria-hidden='true'></svg></button></div>",
        "<button aria-label='More actions' data-testid='actions-button' type='button' aria-haspopup='menu' aria-expanded='false'></button>"
      ],
      geometry: {
        "[data-testid='sidebar-wrapper']": { left: 20, top: 20, width: 44, height: 44 },
        "#flex-nav-collapse-button": { left: 22, top: 22, width: 40, height: 40 },
        "[data-testid='actions-button']": { left: 120, top: 20, width: 40, height: 40 }
      },
      elementsFromPointSelectors: ["#flex-nav-collapse-button"],
      expect: {
        directiveTargets: {
          sidebar: "#flex-nav-collapse-button"
        }
      }
    });
  });

  test("does not classify the user drawer profile trigger as sidebar by itself", () => {
    runHintScenarioCase({
      fixtures: [userDrawerMenuOuterHtml],
      expect: {
        missingDirectiveTargets: ["sidebar"]
      }
    });
  });
});