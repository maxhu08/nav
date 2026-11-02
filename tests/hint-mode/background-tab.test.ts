import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { handleOpenBackgroundTabMessage } from "~/src/background/open-background-tab";
import { initializeLanguage, translate } from "~/src/i18n";
import { isOpenBackgroundTabMessage } from "~/src/shared/background-messages";
import { HINT_CONTAINER_ID } from "~/src/core/utils/hint-mode/shared/constants";
import { withHintController } from "~/tests/helpers/hint-mode";

const create = mock(async (_properties: chrome.tabs.CreateProperties) => ({}));
const sender = { tab: { windowId: 7, index: 2 } as chrome.tabs.Tab };
const send = mock(async (message: { url: string }) =>
  handleOpenBackgroundTabMessage(message.url, sender)
);
let descriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  descriptor = Object.getOwnPropertyDescriptor(globalThis, "chrome");
  create.mockClear();
  send.mockClear();
  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: {
      runtime: { sendMessage: send },
      tabs: { create },
      storage: {
        local: {
          get: (_keys: string[], callback: (data: { optionsLanguage: string }) => void) =>
            callback({ optionsLanguage: "de" })
        }
      },
      i18n: { getUILanguage: () => "en-US" }
    }
  });
});

afterEach(async () => {
  chrome.storage.local.get = ((_keys: string[], callback: (data: object) => void) =>
    callback({ optionsLanguage: "en" })) as typeof chrome.storage.local.get;
  await initializeLanguage();
  if (descriptor) Object.defineProperty(globalThis, "chrome", descriptor);
  else Reflect.deleteProperty(globalThis, "chrome");
});

describe("background tab hints", () => {
  test("validates requests", () => {
    expect(
      isOpenBackgroundTabMessage({ type: "open-background-tab", url: "https://example.com" })
    ).toBe(true);
    for (const value of [null, {}, { type: "fetch-image", url: "https://example.com" }]) {
      expect(isOpenBackgroundTabMessage(value)).toBe(false);
    }
    for (const url of [undefined, null, 42, ""]) {
      expect(isOpenBackgroundTabMessage({ type: "open-background-tab", url })).toBe(false);
    }
  });

  test("opens one inactive tab beside the source and exits hints without navigating", async () => {
    await withHintController(
      '<a href="/docs">Docs</a><button>Not a link</button>',
      async (context) => {
        context.controller.setHintCharset("ab");
        expect(context.controller.activateMode("background-tab")).toBe(true);
        context.controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "a" }));
        expect(context.controller.isHintModeActive()).toBe(false);
        expect(context.getMode()).toBe("normal");
        expect(document.getElementById(HINT_CONTAINER_ID)).toBeNull();
        await Bun.sleep(0);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith({
          type: "open-background-tab",
          url: "https://example.com/docs"
        });
        expect(create).toHaveBeenCalledWith({
          url: "https://example.com/docs",
          active: false,
          windowId: 7,
          index: 3
        });
        expect(window.location.href).toBe("https://example.com/");
      }
    );
  });

  test("supports the hint toggle key without opening a tab", async () => {
    await withHintController('<a href="/docs">Docs</a>', (context) => {
      expect(context.controller.activateMode("background-tab", { toggleKey: "f" })).toBe(true);
      context.controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "f" }));
      expect(context.controller.isHintModeActive()).toBe(false);
      expect(send).not.toHaveBeenCalled();
    });
  });

  test("handles requests from extension pages without sender tab metadata", async () => {
    expect(await handleOpenBackgroundTabMessage("https://example.com/docs", {})).toEqual({
      ok: true
    });
    expect(create).toHaveBeenCalledWith({ url: "https://example.com/docs", active: false });
  });

  test("reports tab creation failures", async () => {
    create.mockRejectedValueOnce(new Error("Tab creation failed"));
    expect(await handleOpenBackgroundTabMessage("https://example.com/docs", sender)).toEqual({
      ok: false
    });
  });

  test.each(["response", "rejection"])(
    "localizes a failed %s using the saved language",
    async (failure) => {
      if (failure === "response") send.mockResolvedValueOnce({ ok: false });
      else send.mockRejectedValueOnce(new Error("Background unavailable"));

      await withHintController('<a href="/docs">Docs</a>', async (context) => {
        const { WINDOW_TOAST_KEY } = await import("~/src/core/utils/sonner");
        const error = mock(() => {});
        Object.defineProperty(window, WINDOW_TOAST_KEY, { configurable: true, value: { error } });
        context.controller.setHintCharset("ab");
        context.controller.activateMode("background-tab");
        context.controller.handleHintKeydown(new window.KeyboardEvent("keydown", { key: "a" }));
        await Bun.sleep(0);
        expect(error).toHaveBeenCalledWith(
          translate("de", "Could not open background tab."),
          undefined
        );
      });
    }
  );
});