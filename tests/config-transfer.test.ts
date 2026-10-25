import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { JSDOM } from "jsdom";
import { type Config, defaultConfig } from "~/src/utils/config";
import type { FastConfig } from "~/src/utils/fast-config";

type Transfer = {
  saveAndExportConfig: () => Promise<void>;
  importConfigAndSave: () => Promise<void>;
  fillInputs: (config: Config) => void;
  listenToKeys: () => void;
  buildFastConfig: (config: Config) => FastConfig;
};

const pages: JSDOM[] = [];
let script: string;

beforeAll(async () => {
  // Each page gets the real modules and its own cached options elements.
  const result = await Bun.build({
    entrypoints: ["config-transfer-test"],
    target: "browser",
    format: "iife",
    plugins: [
      {
        name: "config-transfer-test",
        setup(build) {
          build.onResolve({ filter: /^config-transfer-test$/ }, () => ({
            path: "config-transfer-test",
            namespace: "test"
          }));
          build.onLoad({ filter: /.*/, namespace: "test" }, () => ({
            contents: `
              import { saveAndExportConfig } from "~/src/options/scripts/utils/export-config";
              import { importConfigAndSave } from "~/src/options/scripts/utils/import-config";
              import { fillInputs } from "~/src/options/scripts/utils/fill-inputs";
              import { listenToKeys } from "~/src/options/scripts/keybinds";
              import { buildFastConfig } from "~/src/utils/fast-config";
              window.transfer = { saveAndExportConfig, importConfigAndSave, fillInputs, listenToKeys, buildFastConfig };
            `,
            loader: "ts",
            resolveDir: process.cwd()
          }));
        }
      }
    ]
  });
  if (!result.success) throw new AggregateError(result.logs);
  script = await result.outputs[0].text();
});

afterEach(() => {
  pages.splice(0).forEach((page) => page.window.close());
});

const createPage = async () => {
  const dom = new JSDOM(await Bun.file("src/options.html").text(), {
    url: "https://example.com/options.html",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  pages.push(dom);
  const window = dom.window as JSDOM["window"] & { transfer: Transfer };
  const stored = {
    config: structuredClone(defaultConfig),
    fastConfig: undefined as FastConfig | undefined
  };
  const set = mock((data: Partial<typeof stored>, callback: () => void) => {
    Object.assign(stored, structuredClone(data));
    callback();
  });
  Object.assign(window, {
    chrome: {
      runtime: { getManifest: () => ({ version: "1.2.3" }) },
      storage: {
        local: {
          get: (_keys: string[], callback: (data: typeof stored) => void) => callback(stored),
          set
        }
      }
    },
    Blob,
    structuredClone
  });
  const copy = mock(async (_text: string) => {});
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: copy } });
  const blobs: Blob[] = [];
  window.URL.createObjectURL = mock((blob: Blob) => {
    blobs.push(blob);
    return `blob:https://example.com/${blobs.length}`;
  });
  window.URL.revokeObjectURL = mock(() => {});
  const downloads: string[] = [];
  window.document.addEventListener("click", (event) => {
    if (event.target instanceof window.HTMLAnchorElement) {
      event.preventDefault();
      downloads.push(event.target.download);
    }
  });
  window.HTMLCanvasElement.prototype.getContext = mock(() => null);
  window.eval(script);
  Object.assign(window, {
    toast: { success: mock(() => {}), error: mock(() => {}), info: mock(() => {}) }
  });
  stored.fastConfig = window.transfer.buildFastConfig(defaultConfig);
  window.transfer.fillInputs(defaultConfig);

  const button = (text: string) => {
    const button = Array.from(window.document.querySelectorAll("[role=dialog] button")).find(
      (button) => button.textContent === text
    );
    if (!(button instanceof window.HTMLButtonElement)) throw new Error(`Missing button: ${text}`);
    return button;
  };

  return { window, stored, set, copy, blobs, downloads, button };
};

describe("config export", () => {
  test("matches mtab's export choices without wallpapers and cancels without saving", async () => {
    const page = await createPage();
    const pending = page.window.transfer.saveAndExportConfig();
    const dialog = page.window.document.querySelector("[role=dialog]")!;
    expect(dialog.getAttribute("aria-label")).toBe("Export");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.classList.contains("border-emerald-500")).toBe(true);
    expect(
      Array.from(dialog.querySelectorAll("button")).map((button) => button.textContent)
    ).toEqual(["download config", "copy to clipboard", "cancel"]);
    expect(dialog.textContent).not.toContain("wallpaper");
    expect(dialog.querySelector(".grid-cols-1")?.textContent).toContain("or");
    expect(page.window.document.activeElement).toBe(page.button("download config"));
    await page.window.transfer.saveAndExportConfig();
    expect(page.window.document.querySelectorAll("[role=dialog]")).toHaveLength(1);
    page.button("cancel").click();
    await pending;
    expect(page.set).not.toHaveBeenCalled();
    expect(page.copy).not.toHaveBeenCalled();
    expect(page.downloads).toEqual([]);
  });

  test("downloads config.txt with current edits and imports it only after confirmation", async () => {
    const page = await createPage();
    const document = page.window.document;
    const search = document.getElementById("bar-search-engine-url-input") as HTMLInputElement;
    search.value = "https://example.com/search?q={}";
    const exporting = page.window.transfer.saveAndExportConfig();
    page.button("download config").click();
    await exporting;
    expect(page.downloads).toEqual(["config.txt"]);
    expect(page.blobs[0].type).toBe("text/plain;charset=utf-8");
    const text = await page.blobs[0].text();
    expect(text).toBe(`NAV_SAVE_FORMAT_v1.2.3_${JSON.stringify(page.stored.config)}`);
    expect(page.stored.config.bar.searchEngineURL).toBe(search.value);
    expect(page.stored.fastConfig).toEqual(
      page.window.transfer.buildFastConfig(page.stored.config)
    );
    expect(page.copy).not.toHaveBeenCalled();

    page.window.transfer.fillInputs(defaultConfig);
    page.set.mockClear();
    const importing = page.window.transfer.importConfigAndSave();
    const dialog = document.querySelector("[role=dialog]")!;
    expect(dialog.getAttribute("aria-label")).toBe(
      "Input your save. This will overwrite your current config."
    );
    expect(dialog.classList.contains("border-emerald-500")).toBe(true);
    const input = dialog.querySelector<HTMLInputElement>("input[type=text]")!;
    expect(input.placeholder).toBe("Paste here...");
    expect(
      Array.from(dialog.querySelectorAll("button")).map((button) => button.textContent)
    ).toEqual(["upload config", "cancel", "ok"]);
    const file = dialog.querySelector<HTMLInputElement>("input[type=file]")!;
    expect(file.accept).toBe(".txt,text/plain");
    expect(file.hidden).toBe(true);
    await new Promise((resolve) => page.window.setTimeout(resolve, 0));
    page.button("upload config").focus();
    const loaded = new Promise<void>((resolve) =>
      input.addEventListener("focus", () => resolve(), { once: true })
    );
    Object.defineProperty(file, "files", { value: [new File([text], "config.txt")] });
    file.dispatchEvent(new page.window.Event("change"));
    await loaded;
    expect(input.value).toBe(text);
    expect(page.set).not.toHaveBeenCalled();
    expect(search.value).toBe(defaultConfig.bar.searchEngineURL);
    page.button("ok").click();
    await importing;
    expect(search.value).toBe("https://example.com/search?q={}");
    expect(page.set).toHaveBeenCalledTimes(1);
    expect(page.stored.fastConfig).toEqual(
      page.window.transfer.buildFastConfig(page.stored.config)
    );
  });

  test("keeps clipboard export available", async () => {
    const page = await createPage();
    const pending = page.window.transfer.saveAndExportConfig();
    page.button("copy to clipboard").click();
    page.button("copy to clipboard").click();
    await pending;
    expect(page.copy).toHaveBeenCalledTimes(1);
    expect(page.set).toHaveBeenCalledTimes(1);
    expect(page.copy).toHaveBeenCalledWith(
      `NAV_SAVE_FORMAT_v1.2.3_${JSON.stringify(page.stored.config)}`
    );
    expect(page.window.toast.success).toHaveBeenCalledWith("Config saved & copied to clipboard.");
    expect(page.downloads).toEqual([]);
  });

  test.each(["copy to clipboard", "download config"])("reports failures for %s", async (action) => {
    const page = await createPage();
    page.copy.mockRejectedValue(new Error("Clipboard denied"));
    page.window.URL.createObjectURL = () => {
      throw new Error("Download failed");
    };
    const pending = page.window.transfer.saveAndExportConfig();
    page.button(action).click();
    await pending;
    expect(page.window.toast.error).toHaveBeenCalledWith(
      action === "copy to clipboard"
        ? "Could not save config to clipboard."
        : "Could not export config."
    );
  });

  test("opens from Ctrl+E, wraps keyboard focus, and closes with Escape", async () => {
    const page = await createPage();
    const document = page.window.document;
    page.window.transfer.listenToKeys();
    document.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "e", ctrlKey: true }));
    page.button("cancel").focus();
    document.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).toBe(page.button("download config"));
    document.dispatchEvent(
      new page.window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true })
    );
    expect(document.activeElement).toBe(page.button("cancel"));
    const closed = new Promise<void>((resolve) => {
      const observer = new page.window.MutationObserver(() => {
        if (document.querySelector("[role=dialog]")) return;
        observer.disconnect();
        resolve();
      });
      observer.observe(document.body, { childList: true });
    });
    document.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "Escape" }));
    await closed;
    expect(page.set).not.toHaveBeenCalled();
  });
});

describe("config import", () => {
  test("still accepts pasted saves from older nav versions", async () => {
    const page = await createPage();
    const pending = page.window.transfer.importConfigAndSave();
    const input = page.window.document.querySelector<HTMLInputElement>(
      "[role=dialog] input[type=text]"
    )!;
    input.value =
      'NAV_SAVE_FORMAT_v1.0.3_{"bar":{"searchEngineURL":"https://example.com/?q={}"},"hints":{"reservedLabels":"@input kj"}}';
    input.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await pending;
    expect(page.stored.config.bar.searchEngineURL).toBe("https://example.com/?q={}");
    expect(page.stored.config.hints).toEqual(defaultConfig.hints);
    expect(page.stored.fastConfig).toEqual(
      page.window.transfer.buildFastConfig(page.stored.config)
    );
  });

  test.each([
    ["", "input was empty, nothing imported"],
    ["not a nav save", "incorrect save format, expected NAV_SAVE_FORMAT_v#.#.#_"],
    ["NAV_SAVE_FORMAT_v1.2.3_{", "invalid config data"],
    ["NAV_SAVE_FORMAT_v1.2.3_null", "invalid config data"],
    ["NAV_SAVE_FORMAT_v1.2.3_[]", "invalid config data"]
  ])("rejects %s without overwriting settings", async (value, message) => {
    const page = await createPage();
    const pending = page.window.transfer.importConfigAndSave();
    page.window.document.querySelector<HTMLInputElement>("[role=dialog] input[type=text]")!.value =
      value;
    page.button("ok").click();
    await pending;
    expect(value ? page.window.toast.error : page.window.toast.info).toHaveBeenCalledWith(message);
    expect(page.set).not.toHaveBeenCalled();
    expect(page.stored.config).toEqual(defaultConfig);
  });

  test("Enter on upload opens the file picker instead of submitting", async () => {
    const page = await createPage();
    const pending = page.window.transfer.importConfigAndSave();
    const file = page.window.document.querySelector<HTMLInputElement>("input[type=file]")!;
    const click = mock(() => {});
    file.click = click;
    const upload = page.button("upload config");
    upload.focus();
    const key = new page.window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true
    });
    upload.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
    upload.click();
    expect(click).toHaveBeenCalledTimes(1);
    expect(page.set).not.toHaveBeenCalled();
    page.button("cancel").click();
    await pending;
    expect(page.set).not.toHaveBeenCalled();
  });
});