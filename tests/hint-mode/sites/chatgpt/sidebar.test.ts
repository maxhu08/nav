import { describe, expect, test } from "bun:test";
import {
  HINT_MARKER_MIN_GAP,
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { getHintableElements } from "~/src/core/utils/hint-mode/collection/get-hintable-elements";
import { renderHintTargets } from "~/src/core/utils/hint-mode/rendering/render-hint-targets";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const setViewport = (width: number, height: number): void => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height
  });
};

const setRect = (
  element: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number
): void => {
  const rect = new DOMRect(left, top, width, height);
  element.getBoundingClientRect = (): DOMRect => rect;
  element.getClientRects = (): DOMRectList => {
    const list = [rect] as unknown as DOMRectList & DOMRect[];
    list.item = (index: number): DOMRect | null => list[index] ?? null;
    return list;
  };
};

const setMarkerSize = (marker: HTMLDivElement): void => {
  const hasIcon = !!marker.querySelector("[data-nav-hint-marker-icon='true']");
  const label = marker.querySelector("[data-nav-hint-marker-label='true']");

  Object.defineProperty(marker, "offsetWidth", {
    configurable: true,
    get: () => (hasIcon ? 60 : 48)
  });
  Object.defineProperty(marker, "offsetHeight", {
    configurable: true,
    get: () => 20
  });

  if (label instanceof HTMLElement) {
    Object.defineProperty(label, "offsetWidth", {
      configurable: true,
      get: () => 32
    });
  }
};

const getRequiredElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector(selector);
  expect(element).toBeInstanceOf(HTMLElement);
  return element as T;
};

const getRequiredTarget = (
  targets: ReturnType<typeof buildHintTargets>,
  selector: string
): (typeof targets)[number] => {
  const element = getRequiredElement<HTMLElement>(selector);
  const target = targets.find((candidate) => candidate.element === element);
  expect(target).toBeDefined();
  return target as (typeof targets)[number];
};

const getMarkerLeft = (target: ReturnType<typeof buildHintTargets>[number]): number => {
  return Number.parseFloat(target.marker.style.left) || 0;
};

const getMarkerTop = (target: ReturnType<typeof buildHintTargets>[number]): number => {
  return Number.parseFloat(target.marker.style.top) || 0;
};

const getMarkerRight = (target: ReturnType<typeof buildHintTargets>[number]): number => {
  return getMarkerLeft(target) + target.marker.offsetWidth;
};

describe("ChatGPT sidebar hint marker placement", () => {
  test("collects focusable sidebar rows even when rendered as divs", () => {
    const fixture = createDomFixture(`
      <aside>
        <div
          id="search-chats-row"
          tabindex="0"
          data-fill=""
          class="group __menu-item hoverable"
          data-sidebar-keep-open="true"
          data-state="closed"
          data-sidebar-item="true"
        >
          <div class="flex min-w-0 items-center gap-1.5">
            <div class="flex items-center justify-center icon"></div>
            <div class="flex min-w-0 grow items-center gap-2.5"><div class="truncate">Search chats</div></div>
          </div>
        </div>

        <div
          id="deep-research-row"
          tabindex="0"
          data-fill=""
          class="group __menu-item hoverable gap-1.5"
          data-sidebar-keep-open="true"
          data-state="closed"
          data-sidebar-item="true"
        >
          <div class="flex items-center justify-center icon"></div>
          <div class="flex min-w-0 grow items-center gap-2.5"><div class="truncate">Deep research</div></div>
        </div>

        <div
          id="settings-row"
          tabindex="0"
          data-fill=""
          class="group __menu-item hoverable gap-1.5"
          data-testid="settings-menu-item"
          data-sidebar-item="true"
        >
          <div class="flex items-center justify-center icon"></div>
          Settings
        </div>

        <div
          id="help-row"
          tabindex="0"
          data-fill=""
          class="group __menu-item hoverable"
          aria-haspopup="menu"
          aria-expanded="false"
          data-state="closed"
          data-sidebar-item="true"
        >
          <div class="flex min-w-0 items-center gap-1.5">
            <div class="flex items-center justify-center icon"></div>
            <div class="flex min-w-0 grow items-center gap-2.5"><div class="truncate">Help</div></div>
          </div>
        </div>
      </aside>
    `);

    try {
      const hintableElements = getHintableElements("current-tab");

      expect(hintableElements.some((element) => element.id === "search-chats-row")).toBe(true);
      expect(hintableElements.some((element) => element.id === "deep-research-row")).toBe(true);
      expect(hintableElements.some((element) => element.id === "settings-row")).toBe(true);
      expect(hintableElements.some((element) => element.id === "help-row")).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps current project row markers on the toggle, title, and row corner", () => {
    const fixture = createDomFixture(`
      <ul class="m-0 list-none p-0">
        <li class="list-none">
          <a
            id="project-row"
            tabindex="0"
            data-fill=""
            class="group __menu-item hoverable"
            data-sidebar-item="true"
            href="/g/g-p-example/project"
          >
            <div class="flex min-w-0 items-center gap-1.5">
              <div class="flex items-center justify-center icon">
                <button
                  id="project-toggle"
                  type="button"
                  aria-label="Show items"
                  class="flex h-5 w-5 items-center justify-center"
                  data-state="closed"
                >
                  <span class="relative block h-5 w-5">
                    <span class="absolute inset-0 flex items-center justify-center scale-100 opacity-100">
                      <div data-testid="project-folder-icon" style="color: rgb(80, 140, 255);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-label="Project icon"></svg>
                      </div>
                    </span>
                  </span>
                </button>
              </div>
              <div class="flex min-w-0 grow items-center gap-2.5">
                <div id="project-title" class="truncate">Example Project</div>
              </div>
            </div>
            <div class="trailing highlight text-token-text-tertiary">
              <button
                id="project-options"
                tabindex="0"
                data-trailing-button=""
                class="__menu-item-trailing-btn"
                aria-label="Open project options for Example Project"
                type="button"
                aria-haspopup="menu"
                aria-expanded="false"
                data-state="closed"
              >
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" class="icon"></svg>
                </div>
              </button>
            </div>
          </a>
        </li>
      </ul>
    `);

    try {
      setViewport(420, 300);

      const projectRow = getRequiredElement<HTMLAnchorElement>("#project-row");
      const projectToggle = getRequiredElement<HTMLButtonElement>("#project-toggle");
      const projectTitle = getRequiredElement<HTMLElement>("#project-title");
      const projectOptions = getRequiredElement<HTMLButtonElement>("#project-options");

      setRect(projectRow, 12, 64, 300, 32);
      setRect(projectToggle, 20, 70, 20, 20);
      setRect(projectTitle, 64, 72, 88, 16);
      setRect(projectOptions, 12, 64, 20, 20);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const toggleTarget = getRequiredTarget(targets, "#project-toggle");
      const rowTarget = getRequiredTarget(targets, "#project-row");
      const optionsTarget = getRequiredTarget(targets, "#project-options");

      expect(toggleTarget.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("focus-action");
      expect(rowTarget.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
      expect(optionsTarget.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("inline-icon");
      expect(rowTarget.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)).toBeNull();

      expect(getMarkerTop(toggleTarget)).toBe(64);
      expect(getMarkerTop(rowTarget)).toBe(64);
      expect(getMarkerTop(optionsTarget)).toBe(64);

      expect(getMarkerLeft(toggleTarget)).toBe(20);
      expect(getMarkerLeft(rowTarget)).toBe(getMarkerRight(toggleTarget) + HINT_MARKER_MIN_GAP);
      expect(getMarkerLeft(optionsTarget)).toBe(252);
      expect(getMarkerLeft(optionsTarget)).toBeGreaterThanOrEqual(
        getMarkerRight(rowTarget) + HINT_MARKER_MIN_GAP
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps history row markers at the row start and row corner", () => {
    const fixture = createDomFixture(`
      <ul class="m-0 list-none p-0">
        <li class="list-none">
          <a
            id="history-row"
            tabindex="0"
            data-fill=""
            class="group __menu-item hoverable"
            draggable="true"
            aria-label="Example Thread"
            data-sidebar-item="true"
            href="/c/example-thread"
          >
            <div class="flex min-w-0 grow items-center gap-2.5">
              <div class="truncate"><span dir="auto">Example Thread</span></div>
            </div>
            <div class="trailing highlight text-token-text-tertiary">
              <div class="flex items-center gap-2">
                <button
                  id="history-options"
                  tabindex="0"
                  data-trailing-button=""
                  class="__menu-item-trailing-btn"
                  data-testid="history-item-0-options"
                  data-conversation-options-trigger="conversation-0"
                  aria-label="Open conversation options for Example Thread"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  data-state="closed"
                >
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" class="icon"></svg>
                  </div>
                </button>
              </div>
            </div>
          </a>
        </li>
      </ul>
    `);

    try {
      setViewport(420, 300);

      const historyRow = getRequiredElement<HTMLAnchorElement>("#history-row");
      const historyOptions = getRequiredElement<HTMLButtonElement>("#history-options");

      setRect(historyRow, 12, 112, 300, 32);
      setRect(historyOptions, 12, 112, 20, 20);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const rowTarget = getRequiredTarget(targets, "#history-row");
      const optionsTarget = getRequiredTarget(targets, "#history-options");

      expect(rowTarget.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("default");
      expect(optionsTarget.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("inline-icon");

      expect(getMarkerTop(rowTarget)).toBe(112);
      expect(getMarkerTop(optionsTarget)).toBe(112);
      expect(getMarkerLeft(rowTarget)).toBeCloseTo(17.6, 5);
      expect(getMarkerLeft(optionsTarget)).toBe(252);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps popup action menu item markers at the row corner", () => {
    const fixture = createDomFixture(`
      <div role="menu" aria-label="Conversation options">
        <button
          id="rename-action"
          role="menuitem"
          type="button"
          aria-label="Rename"
        >
          Rename
        </button>
        <button
          id="delete-action"
          role="menuitem"
          type="button"
          aria-label="Delete"
        >
          Delete
        </button>
      </div>
    `);

    try {
      setViewport(420, 300);

      const renameAction = getRequiredElement<HTMLButtonElement>("#rename-action");
      const deleteAction = getRequiredElement<HTMLButtonElement>("#delete-action");

      setRect(renameAction, 120, 112, 180, 32);
      setRect(deleteAction, 120, 152, 180, 32);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const renameTarget = getRequiredTarget(targets, "#rename-action");
      const deleteTarget = getRequiredTarget(targets, "#delete-action");

      expect(getMarkerLeft(renameTarget)).toBe(252);
      expect(getMarkerTop(renameTarget)).toBe(112);
      expect(getMarkerLeft(deleteTarget)).toBe(252);
      expect(getMarkerTop(deleteTarget)).toBe(152);
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps sanitized multi-section sidebar rows aligned without overlap", () => {
    const fixture = createDomFixture(`
      <div class="group/sidebar-expando-section mb-2">
        <button id="gpts-toggle" aria-expanded="true" class="text-token-text-tertiary flex w-full items-center justify-start gap-0.5 px-4 py-1.5" type="button">
          <h2 class="__menu-label" data-no-spacing="true">GPTs</h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true"></svg>
        </button>
        <ul class="m-0 list-none p-0">
          <li class="list-none">
            <a id="gpt-row" tabindex="0" class="group __menu-item hoverable" data-sidebar-item="true" href="/g/example-tool">
              <div class="flex min-w-0 items-center gap-1.5">
                <div class="flex items-center justify-center icon"><img alt="" src="https://example.com/tool.png" /></div>
                <div class="flex min-w-0 grow items-center gap-2.5"><div class="truncate">Example Tool</div></div>
              </div>
              <div class="trailing highlight text-token-text-tertiary">
                <button id="gpt-options" tabindex="0" data-trailing-button="" class="__menu-item-trailing-btn" type="button" aria-haspopup="menu" aria-expanded="false" data-state="closed">
                  <div><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" class="icon"></svg></div>
                </button>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div class="group/sidebar-expando-section mb-2">
        <button id="projects-toggle" aria-expanded="true" class="text-token-text-tertiary flex w-full items-center justify-start gap-0.5 px-4 py-1.5" type="button">
          <h2 class="__menu-label" data-no-spacing="true">Projects</h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true"></svg>
        </button>
        <ul class="m-0 list-none p-0">
          <li class="list-none">
            <a id="project-row-2" tabindex="0" class="group __menu-item hoverable" data-sidebar-item="true" href="/g/example-project">
              <div class="flex min-w-0 items-center gap-1.5">
                <div class="flex items-center justify-center icon">
                  <button id="project-toggle-2" type="button" aria-label="Show items" class="flex h-5 w-5 items-center justify-center" data-state="closed">
                    <span class="relative block h-5 w-5">
                      <span class="absolute inset-0 flex items-center justify-center scale-100 opacity-100">
                        <div data-testid="project-folder-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-label="Project icon"></svg></div>
                      </span>
                    </span>
                  </button>
                </div>
                <div class="flex min-w-0 grow items-center gap-2.5"><div class="truncate">Example Project</div></div>
              </div>
              <div class="trailing highlight text-token-text-tertiary">
                <button id="project-options-2" tabindex="0" data-trailing-button="" class="__menu-item-trailing-btn" aria-label="Open project options for Example Project" type="button" aria-haspopup="menu" aria-expanded="false" data-state="closed">
                  <div><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" class="icon"></svg></div>
                </button>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div class="group/sidebar-expando-section mb-2">
        <button id="history-toggle" aria-expanded="true" class="text-token-text-tertiary flex w-full items-center justify-start gap-0.5 px-4 py-1.5" type="button">
          <h2 class="__menu-label" data-no-spacing="true">Your chats</h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true"></svg>
        </button>
        <div id="history">
          <ul class="m-0 list-none p-0">
            <li class="list-none">
              <a id="history-row-2" tabindex="0" class="group __menu-item hoverable" draggable="true" aria-label="Example Conversation" data-sidebar-item="true" href="/c/example-conversation">
                <div class="flex min-w-0 grow items-center gap-2.5"><div class="truncate"><span dir="auto">Example Conversation</span></div></div>
                <div class="trailing highlight text-token-text-tertiary">
                  <div class="flex items-center gap-2">
                    <button id="history-options-2" tabindex="0" data-trailing-button="" class="__menu-item-trailing-btn" data-testid="history-item-0-options" data-conversation-options-trigger="conversation-0" aria-label="Open conversation options for Example Conversation" type="button" aria-haspopup="menu" aria-expanded="false" data-state="closed">
                      <div><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" class="icon"></svg></div>
                    </button>
                  </div>
                </div>
              </a>
            </li>
          </ul>
        </div>
      </div>
    `);

    try {
      setViewport(420, 500);

      const gptsToggle = getRequiredElement<HTMLButtonElement>("#gpts-toggle");
      const gptRow = getRequiredElement<HTMLAnchorElement>("#gpt-row");
      const gptOptions = getRequiredElement<HTMLButtonElement>("#gpt-options");
      const projectsToggle = getRequiredElement<HTMLButtonElement>("#projects-toggle");
      const projectRow = getRequiredElement<HTMLAnchorElement>("#project-row-2");
      const projectToggle = getRequiredElement<HTMLButtonElement>("#project-toggle-2");
      const projectOptions = getRequiredElement<HTMLButtonElement>("#project-options-2");
      const historyToggle = getRequiredElement<HTMLButtonElement>("#history-toggle");
      const historyRow = getRequiredElement<HTMLAnchorElement>("#history-row-2");
      const historyOptions = getRequiredElement<HTMLButtonElement>("#history-options-2");

      setRect(gptsToggle, 12, 24, 300, 24);
      setRect(gptRow, 12, 56, 300, 32);
      setRect(gptOptions, 12, 56, 20, 20);
      setRect(projectsToggle, 12, 108, 300, 24);
      setRect(projectRow, 12, 140, 300, 32);
      setRect(projectToggle, 20, 146, 20, 20);
      setRect(projectOptions, 12, 140, 20, 20);
      setRect(historyToggle, 12, 192, 300, 24);
      setRect(historyRow, 12, 224, 300, 32);
      setRect(historyOptions, 12, 224, 20, 20);

      const targets = buildHintTargets("current-tab", "asdf", 1, false);
      targets.forEach((target) => setMarkerSize(target.marker));
      renderHintTargets(targets);

      const gptsToggleTarget = getRequiredTarget(targets, "#gpts-toggle");
      const gptRowTarget = getRequiredTarget(targets, "#gpt-row");
      const projectToggleTarget = getRequiredTarget(targets, "#project-toggle-2");
      const projectRowTarget = getRequiredTarget(targets, "#project-row-2");
      const historyToggleTarget = getRequiredTarget(targets, "#history-toggle");
      const historyRowTarget = getRequiredTarget(targets, "#history-row-2");

      expect(getMarkerLeft(gptsToggleTarget)).toBe(20);
      expect(getMarkerLeft(gptRowTarget)).toBeCloseTo(17.6, 5);
      expect(getMarkerLeft(projectToggleTarget)).toBe(20);
      expect(getMarkerLeft(historyToggleTarget)).toBe(20);
      expect(getMarkerLeft(historyRowTarget)).toBeCloseTo(17.6, 5);

      expect(getMarkerTop(gptRowTarget)).toBe(56);
      expect(getMarkerTop(getRequiredTarget(targets, "#gpt-options"))).toBe(56);
      expect(getMarkerTop(projectToggleTarget)).toBe(140);
      expect(getMarkerTop(projectRowTarget)).toBe(140);
      expect(getMarkerTop(getRequiredTarget(targets, "#project-options-2"))).toBe(140);
      expect(getMarkerTop(historyRowTarget)).toBe(224);
      expect(getMarkerTop(getRequiredTarget(targets, "#history-options-2"))).toBe(224);

      expect(getMarkerLeft(projectRowTarget)).toBe(
        getMarkerRight(projectToggleTarget) + HINT_MARKER_MIN_GAP
      );
    } finally {
      fixture.cleanup();
    }
  });
});