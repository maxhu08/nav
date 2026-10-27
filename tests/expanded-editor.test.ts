import { afterEach, describe, expect, mock, test } from "bun:test";
import { JSDOM } from "jsdom";

const pages: JSDOM[] = [];
const fields = [
  ["rules-urls-blacklist", "rules.urls.blacklist"],
  ["rules-urls-whitelist", "rules.urls.whitelist"],
  ["hotkeys-mappings", "hotkeys.mappings"],
  ["hints-avoid-adjacent-pairs", "hints.avoidAdjacentPairs"],
  ["hints-reserved-labels", "hints.directives"],
  ["hints-custom-selectors", "hints.advanced.customSelectors"],
  ["hints-custom-css", "hints.customCSS"],
  ["bar-search-bookmarks-storage", "bar.search.bookmarks.storage"],
  ["bar-custom-css", "bar.customCSS"],
  ["find-custom-css", "find.customCSS"]
];

const evaluate = async (page: JSDOM, path: string, call = "") => {
  page.window.eval(
    new Bun.Transpiler({ loader: "ts" }).transformSync(
      (await Bun.file(path).text()).replaceAll("export const ", "const ")
    ) + call
  );
};

const createPage = async () => {
  const page = new JSDOM(await Bun.file("src/options.html").text(), {
    url: "https://example.com/options.html",
    runScripts: "outside-only"
  });
  pages.push(page);
  page.window.scrollTo = mock(() => {});
  await evaluate(page, "src/options/scripts/utils/expanded-editor.ts", "\ninitExpandedEditors();");
  return page;
};

afterEach(() => pages.splice(0).forEach((page) => page.window.close()));

describe("expanded options editors", () => {
  test("covers every multiline editor and no single-line inputs", async () => {
    const page = await createPage();
    const document = page.window.document;
    const buttons = Array.from(document.querySelectorAll("[data-editor-field]"));
    expect(buttons).toHaveLength(10);
    expect(document.querySelectorAll("textarea")).toHaveLength(10);
    expect(
      buttons.map((button) =>
        document.getElementById(button.getAttribute("aria-controls")!)!.querySelector("textarea")
      )
    ).toEqual(Array.from(document.querySelectorAll("textarea")));
  });

  test.each(fields)(
    "expands and restores %s as %s without replacing its editor",
    async (id, key) => {
      const page = await createPage();
      const document = page.window.document;
      const overlay = document.getElementById("expanded-editor")!;
      const button = document.querySelector<HTMLButtonElement>(`[data-editor-field="${key}"]`)!;
      const container = document.getElementById(`${id}-container`)!;
      const textarea = document.getElementById(`${id}-textarea`) as HTMLTextAreaElement;
      const parent = container.parentElement!;
      const children = Array.from(parent.childNodes);
      const description = button.previousElementSibling!;
      const status = document.getElementById(`${id}-status`);
      const input = mock(() => {});
      textarea.addEventListener("input", input);
      textarea.value = "original text";
      textarea.setSelectionRange(2, 5, "backward");
      textarea.scrollTop = 48;
      textarea.scrollLeft = 12;
      // Translated labels must not replace the exact configuration path in the expanded header.
      parent.querySelector("p")!.textContent = "translated field name";

      button.click();

      expect(overlay.hidden).toBe(false);
      expect(document.getElementById("expanded-editor-title")!.textContent).toBe(key);
      expect(document.getElementById("expanded-editor-description")!.firstElementChild).toBe(
        description
      );
      expect(document.getElementById("expanded-editor-surface")!.firstElementChild).toBe(container);
      expect(document.activeElement).toBe(textarea);
      expect(textarea.selectionStart).toBe(2);
      expect(textarea.selectionEnd).toBe(5);
      expect(textarea.selectionDirection).toBe("backward");
      expect(textarea.scrollTop).toBe(48);
      expect(textarea.scrollLeft).toBe(12);
      expect(document.querySelector<HTMLElement>(".options-page-layout")!.inert).toBe(true);

      if (status) {
        status.textContent = "live validation error";
        expect(document.getElementById("expanded-editor-status")!.firstElementChild).toBe(status);
        expect(document.getElementById("expanded-editor-status")!.textContent).toBe(
          "live validation error"
        );
      } else {
        expect(document.getElementById("expanded-editor-status")!.hidden).toBe(true);
      }

      textarea.value = "edited text";
      textarea.setSelectionRange(1, 4);
      textarea.dispatchEvent(new page.window.Event("input", { bubbles: true }));
      document.getElementById("expanded-editor-close")!.click();

      expect(input).toHaveBeenCalledTimes(1);
      expect(overlay.hidden).toBe(true);
      expect(Array.from(parent.childNodes)).toEqual(children);
      expect(document.getElementById(`${id}-textarea`)).toBe(textarea);
      expect(textarea.value).toBe("edited text");
      expect(textarea.selectionStart).toBe(1);
      expect(textarea.selectionEnd).toBe(4);
      expect(document.activeElement).toBe(button);
      expect(document.querySelector<HTMLElement>(".options-page-layout")!.inert).not.toBe(true);
      expect(document.documentElement.classList.contains("expanded-editor-open")).toBe(false);
    }
  );

  test("handles Escape before core navigation and leaves save shortcuts untouched", async () => {
    const page = await createPage();
    const document = page.window.document;
    const navigation = mock(() => {});
    const save = mock(() => {});
    page.window.addEventListener("keydown", navigation, true);
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") save();
    });
    document.querySelector<HTMLButtonElement>("[data-editor-field]")!.click();
    const textarea = document.getElementById("rules-urls-blacklist-textarea")!;
    for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
      const event = new page.window.KeyboardEvent("keydown", {
        key: "s",
        bubbles: true,
        cancelable: true,
        ...modifier
      });
      textarea.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(save).toHaveBeenCalledTimes(2);
    navigation.mockClear();
    textarea.dispatchEvent(
      new page.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(navigation).not.toHaveBeenCalled();
    expect(document.getElementById("expanded-editor")!.hidden).toBe(true);
  });

  test("keeps Tab indentation and cycles focus at the modal boundaries", async () => {
    const page = await createPage();
    const document = page.window.document;
    await evaluate(
      page,
      "src/options/scripts/utils/editor-tabs.ts",
      '\nenableEditorTabInsertion(document.getElementById("hints-custom-css-textarea"));'
    );
    document.querySelector<HTMLButtonElement>('[data-editor-field="hints.customCSS"]')!.click();
    const textarea = document.getElementById("hints-custom-css-textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(
      new page.window.KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true
      })
    );
    expect(textarea.value).toBe("  ");
    expect(document.activeElement).toBe(textarea);
    const close = document.getElementById("expanded-editor-close")!;
    close.focus();
    close.dispatchEvent(
      new page.window.KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true
      })
    );
    expect(document.activeElement).toBe(textarea);
  });

  test("restores pre-existing inert state and ignores Escape in a separate dialog", async () => {
    const page = await createPage();
    const document = page.window.document;
    const background = document.querySelector<HTMLElement>(".options-page-layout")!;
    background.inert = true;
    document.querySelector<HTMLButtonElement>("[data-editor-field]")!.click();
    const dialog = document.createElement("input");
    document.body.append(dialog);
    dialog.focus();
    dialog.dispatchEvent(
      new page.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(document.getElementById("expanded-editor")!.hidden).toBe(false);
    document.getElementById("expanded-editor-close")!.click();
    expect(background.inert).toBe(true);
  });

  test("restores the page scroll position without smooth scrolling", async () => {
    const page = await createPage();
    Object.defineProperty(page.window, "scrollY", { value: 900 });
    page.window.document.querySelector<HTMLButtonElement>("[data-editor-field]")!.click();
    page.window.document.getElementById("expanded-editor-close")!.click();
    expect(page.window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 900, behavior: "instant" });
  });

  test("restores the inline layout before the reload snapshot is cached", async () => {
    const page = await createPage();
    Object.defineProperty(page.window.performance, "getEntriesByType", { value: () => [] });
    Object.defineProperty(page.window, "CSS", { value: { escape: (id: string) => id } });
    await evaluate(page, "src/options/scripts/loading.ts");
    const document = page.window.document;
    document.documentElement.classList.remove("options-initializing");
    document.querySelector<HTMLButtonElement>("[data-editor-field]")!.click();
    page.window.dispatchEvent(new page.window.Event("pagehide"));
    expect(document.getElementById("expanded-editor")!.hidden).toBe(true);
    expect(page.window.sessionStorage.getItem("options-layout")).toContain(
      "#rules-urls-blacklist-container"
    );
    expect(document.querySelector(".expanded-editor-input")).toBeNull();
  });
});