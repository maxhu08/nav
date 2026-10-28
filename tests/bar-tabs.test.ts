import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CoreMode } from "~/src/core/navigation/shared";
import {
  handleActivateTabMessage,
  handleFetchTabSuggestionsMessage
} from "~/src/background/bar-tabs";
import type { createFindModeController } from "~/src/core/actions/find-mode";
import {
  getFindBar,
  getFindBarActions,
  getFindClearButton,
  getFindInput,
  getFindSuggestions
} from "~/src/core/utils/get-ui";
import { resetSiteKeybindIgnoreForTests } from "~/src/core/utils/ignore-site-keybinds";
import {
  isActivateTabMessage,
  isFetchTabSuggestionsMessage
} from "~/src/shared/background-messages";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const tabs = [
  {
    id: 1,
    windowId: 1,
    title: "Current page",
    url: "https://example.com/",
    incognito: false,
    lastAccessed: 1
  },
  {
    id: 2,
    windowId: 10,
    title: "GitHub",
    url: "https://github.com/nav",
    incognito: false,
    lastAccessed: 2
  },
  {
    id: 3,
    windowId: 20,
    title: "Private",
    url: "https://private.example/",
    incognito: true,
    lastAccessed: 3
  }
];
const sender = { tab: tabs[0] as chrome.tabs.Tab };
const update = mock(async (_id: number, _properties: unknown) => ({}));
const focus = mock(async (_id: number, _properties: unknown) => ({}));
const send = mock(async (message: { type: string; tabId?: number }) => {
  if (message.type === "fetch-tab-suggestions") return handleFetchTabSuggestionsMessage(sender);
  if (message.type === "activate-tab") return handleActivateTabMessage(message.tabId!, sender);
  throw new Error(`Unexpected message: ${message.type}`);
});
let fixture: ReturnType<typeof createDomFixture>;
let controller: ReturnType<typeof createFindModeController>;
let descriptors: Map<"chrome" | "CSS", PropertyDescriptor | undefined>;

beforeEach(async () => {
  fixture = createDomFixture("");
  descriptors = new Map(
    ["chrome", "CSS"].map((key) => [
      key as "chrome" | "CSS",
      Object.getOwnPropertyDescriptor(globalThis, key)
    ])
  );
  update.mockClear();
  focus.mockClear();
  send.mockClear();
  Object.defineProperty(globalThis, "CSS", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: {
      runtime: { sendMessage: send },
      tabs: {
        query: async () => [...tabs, { title: "No ID", incognito: false }],
        get: async (id: number) => {
          const tab = tabs.find((tab) => tab.id === id);
          if (!tab) throw new Error("Tab closed");
          return tab;
        },
        update
      },
      windows: { update: focus }
    }
  });
  let mode: CoreMode = "normal";
  const { createFindModeController } = await import("~/src/core/actions/find-mode");
  controller = createFindModeController({
    getMode: () => mode,
    setMode: (value) => {
      mode = value;
    },
    onFocusIndicator: () => {},
    injectFindUIStyles: () => {}
  });
});

afterEach(() => {
  controller.exitFindMode();
  resetSiteKeybindIgnoreForTests();
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  fixture.cleanup();
});

const type = (value: string) => {
  const input = getFindInput()!;
  input.value = value;
  input.dispatchEvent(new window.Event("input"));
};

const key = (value: string, shiftKey = false) =>
  controller.handleFindUIKeydown(new window.KeyboardEvent("keydown", { key: value, shiftKey }));

describe("background tab search", () => {
  test("returns recent tabs across windows without exposing private tabs or tabs without IDs", async () => {
    const response = await handleFetchTabSuggestionsMessage(sender);
    expect(response.ok).toBe(true);
    expect(response.tabs.map((tab) => tab.id)).toEqual([2, 1]);
    const privateResponse = await handleFetchTabSuggestionsMessage({
      tab: tabs[2] as chrome.tabs.Tab
    });
    expect(privateResponse.tabs.map((tab) => tab.id)).toEqual([3]);
  });

  test("handles closed tabs and refuses to activate a private tab from a normal tab", async () => {
    expect(await handleActivateTabMessage(99, sender)).toEqual({ ok: false });
    expect(await handleActivateTabMessage(3, sender)).toEqual({ ok: false });
    expect(update).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
  });

  test("validates tab search messages", () => {
    expect(isFetchTabSuggestionsMessage({ type: "fetch-tab-suggestions" })).toBe(true);
    expect(isFetchTabSuggestionsMessage(null)).toBe(false);
    expect(isActivateTabMessage({ type: "activate-tab", tabId: 2 })).toBe(true);
    for (const tabId of [undefined, "2", -1, 1.5, NaN, Infinity]) {
      expect(isActivateTabMessage({ type: "activate-tab", tabId })).toBe(false);
    }
  });
});

describe("tab search bar", () => {
  test("keeps the close button visible on opening and clearing, and dismisses the empty bar", async () => {
    controller.openBarPrompt("tabs");
    await Bun.sleep(0);
    expect(getFindBarActions()?.getAttribute("data-visible")).toBe("true");
    expect(getFindClearButton()?.disabled).toBe(false);

    type("github");
    await Bun.sleep(0);
    getFindClearButton()?.click();
    expect(getFindInput()?.value).toBe("");
    expect(getFindBarActions()?.getAttribute("data-visible")).toBe("true");
    expect(getFindClearButton()?.disabled).toBe(false);
    expect(getFindBar()?.getAttribute("data-visible")).toBe("true");

    getFindClearButton()?.click();
    expect(getFindBar()?.getAttribute("data-visible")).toBe("false");
    expect(controller.isFindModeActive()).toBe(false);
    await Bun.sleep(0);
  });

  test("lists tabs on opening, supports keyboard selection, and switches without navigation", async () => {
    controller.setBarSearchTabsEnabled(false);
    expect(controller.openBarPrompt("tabs")).toBe(true);
    await Bun.sleep(0);
    expect(getFindInput()?.placeholder).toBe("search open tabs...");
    expect(getFindSuggestions()?.children).toHaveLength(2);
    expect(send.mock.calls.map((call) => call[0].type)).toEqual(["fetch-tab-suggestions"]);
    expect(key("ArrowDown")).toBe(true);
    expect(getFindInput()?.getAttribute("aria-activedescendant")).toBe("nav-find-suggestion-1");
    expect(key("Tab", true)).toBe(true);
    expect(getFindInput()?.getAttribute("aria-activedescendant")).toBe("nav-find-suggestion-0");
    expect(key("Enter")).toBe(true);
    await Bun.sleep(0);
    expect(update).toHaveBeenCalledWith(2, { active: true });
    expect(focus).toHaveBeenCalledWith(10, { focused: true });
    expect(window.location.href).toBe("https://example.com/");
    expect(getFindBar()?.getAttribute("data-visible")).toBe("false");
  });

  test("filters by title and URL and never searches the web when no tabs match", async () => {
    controller.openBarPrompt("tabs");
    await Bun.sleep(0);
    type("GITHUB");
    await Bun.sleep(0);
    expect(getFindSuggestions()?.children).toHaveLength(1);
    type("example.com");
    await Bun.sleep(0);
    expect(getFindSuggestions()?.textContent).toContain("Current page");
    type("no matching tab");
    await Bun.sleep(0);
    expect(getFindSuggestions()?.children).toHaveLength(0);
    key("Enter");
    expect(update).not.toHaveBeenCalled();
    expect(getFindBar()?.getAttribute("data-visible")).toBe("true");
    expect(send.mock.calls.every((call) => call[0].type === "fetch-tab-suggestions")).toBe(true);
  });

  test("reuses suggestion rows while updating selection, accessibility, and wraparound", async () => {
    controller.openBarPrompt("tabs");
    await Bun.sleep(0);
    const suggestions = getFindSuggestions()!;
    const rows = Array.from(suggestions.children);
    const icon = rows[0]!.querySelector("svg");

    for (const selected of [1, 0, 1]) {
      expect(key("ArrowDown")).toBe(true);
      expect(Array.from(suggestions.children)).toEqual(rows);
      expect(suggestions.children[0]!.querySelector("svg") === icon).toBe(true);
      expect(rows.map((row) => row.getAttribute("data-selected"))).toEqual(
        selected === 0 ? ["true", "false"] : ["false", "true"]
      );
      expect(rows.map((row) => row.getAttribute("aria-selected"))).toEqual(
        selected === 0 ? ["true", "false"] : ["false", "true"]
      );
      expect(suggestions.getAttribute("aria-activedescendant")).toBe(rows[selected]!.id);
      expect(getFindInput()?.getAttribute("aria-activedescendant")).toBe(rows[selected]!.id);
    }

    expect(key("ArrowUp")).toBe(true);
    expect(key("Enter")).toBe(true);
    await Bun.sleep(0);
    expect(update).toHaveBeenCalledWith(2, { active: true });
  });

  for (const mode of ["current-tab", "new-tab"] as const) {
    test(`switches to a tab result instead of opening a duplicate in ${mode} mode`, async () => {
      controller.setBarSearchSuggestionsEnabled(false);
      controller.setBarSearchHistoryEnabled(false);
      controller.openBarPrompt(mode, "github");
      await Bun.sleep(160);
      const result = getFindSuggestions()?.querySelector<HTMLButtonElement>('[data-source="tab"]');
      expect(result).not.toBeNull();
      result!.click();
      await Bun.sleep(0);
      expect(update).toHaveBeenCalledWith(2, { active: true });
      expect(window.location.href).toBe("https://example.com/");
    });
  }

  test("respects the normal-bar toggle", async () => {
    controller.setBarSearchSuggestionsEnabled(false);
    controller.setBarSearchHistoryEnabled(false);
    controller.setBarSearchTabsEnabled(false);
    controller.openBarPrompt("current-tab", "github");
    await Bun.sleep(160);
    expect(send).not.toHaveBeenCalled();
    controller.setBarSearchTabsEnabled(true);
    await Bun.sleep(160);
    expect(getFindSuggestions()?.querySelector('[data-source="tab"]')).not.toBeNull();
  });

  test("ignores tab responses after the bar is dismissed", async () => {
    const response = Promise.withResolvers<{ ok: boolean; tabs: typeof tabs }>();
    send.mockImplementationOnce(() => response.promise);
    controller.openBarPrompt("tabs");
    controller.hideFindBar();
    response.resolve({ ok: true, tabs });
    await Bun.sleep(0);
    expect(getFindSuggestions()?.children).toHaveLength(0);
    expect(getFindBar()?.getAttribute("data-visible")).toBe("false");
  });
});