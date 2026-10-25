import { afterEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import {
  getLanguage,
  getLanguages,
  initializeLanguage,
  resolveLanguage,
  t,
  translate,
  translateDocument
} from "~/src/i18n";
import { de } from "~/src/i18n/locales/de";
import { es } from "~/src/i18n/locales/es";
import { fr } from "~/src/i18n/locales/fr";
import { it } from "~/src/i18n/locales/it";
import { ja } from "~/src/i18n/locales/ja";
import { ko } from "~/src/i18n/locales/ko";
import { ptBR } from "~/src/i18n/locales/pt-br";
import { ru } from "~/src/i18n/locales/ru";
import { zhCN } from "~/src/i18n/locales/zh-cn";
import { initializeI18n } from "~/src/options/scripts/i18n";
import { setEditorStatus } from "~/src/options/scripts/utils/editor-status";
import { createCollapseGroups } from "~/src/options/scripts/utils/collapse-option";
import { type OptionsData, getOptionsData } from "~/src/utils/options-storage";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const messages = { de, es, fr, it, ja, ko, "pt-BR": ptBR, ru, "zh-CN": zhCN };
const chromeDescriptor = Object.getOwnPropertyDescriptor(globalThis, "chrome");

const initialize = async (storedLanguage: unknown, browserLanguage = "en-US") => {
  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    writable: true,
    value: {
      storage: {
        local: {
          get: (_keys: string[], callback: (data: { optionsLanguage: unknown }) => void) =>
            callback({ optionsLanguage: storedLanguage })
        }
      },
      i18n: { getUILanguage: () => browserLanguage }
    }
  });
  await initializeLanguage();
};

afterEach(async () => {
  await initialize("en");
  if (chromeDescriptor) Object.defineProperty(globalThis, "chrome", chromeDescriptor);
  else Reflect.deleteProperty(globalThis, "chrome");
});

describe("settings language resolution", () => {
  test("uses a stored supported language first", () => {
    getLanguages().forEach((locale) => {
      expect(resolveLanguage(locale.value, "fr-CA")).toBe(locale.value);
    });
  });

  test("uses supported browser locales", () => {
    expect(resolveLanguage(undefined, "de-DE")).toBe("de");
    expect(resolveLanguage(undefined, "es-419")).toBe("es");
    expect(resolveLanguage(undefined, "fr-CA")).toBe("fr");
    expect(resolveLanguage(undefined, "it-IT")).toBe("it");
    expect(resolveLanguage(undefined, "ja-JP")).toBe("ja");
    expect(resolveLanguage(undefined, "ko-KR")).toBe("ko");
    expect(resolveLanguage(undefined, "ru_RU")).toBe("ru");
  });

  test("maps Chinese and Portuguese browser locales like mtab", () => {
    expect(resolveLanguage(undefined, "zh-TW")).toBe("zh-CN");
    expect(resolveLanguage(undefined, "zh")).toBe("zh-CN");
    expect(resolveLanguage(undefined, "pt_PT")).toBe("pt-BR");
    expect(resolveLanguage(undefined, "pt")).toBe("pt-BR");
  });

  test("falls back to English for unsupported and inherited property names", () => {
    expect(resolveLanguage(undefined, "en-US")).toBe("en");
    expect(resolveLanguage("invalid", "nl-NL")).toBe("en");
    expect(resolveLanguage("toString", "constructor")).toBe("en");
  });

  test("loads the preference from extension storage", async () => {
    await initialize("ja", "de-DE");
    expect(getLanguage()).toBe("ja");
    expect(t("cancel")).toBe(ja.cancel);
  });
});

describe("settings translations", () => {
  test("keeps English and translates every supported language", () => {
    expect(getLanguages()).toHaveLength(10);
    expect(translate("en", "Changes saved.")).toBe("Changes saved.");
    expect(translate("de", "Changes saved.")).toBe("Änderungen gespeichert.");
    expect(translate("es", "Changes saved.")).toBe("Cambios guardados.");
    expect(translate("fr", "Changes saved.")).toBe("Modifications enregistrées.");
    expect(translate("it", "Changes saved.")).toBe("Modifiche salvate.");
    expect(translate("ja", "Changes saved.")).toBe("変更を保存しました。");
    expect(translate("ko", "Changes saved.")).toBe("변경 사항을 저장했습니다.");
    expect(translate("pt-BR", "Changes saved.")).toBe("Alterações salvas.");
    expect(translate("ru", "Changes saved.")).toBe("Изменения сохранены.");
    expect(translate("zh-CN", "Changes saved.")).toBe("更改已保存。");
  });

  test("substitutes every occurrence without interpreting values as HTML", () => {
    expect(translate("de", "{count} bookmarks imported.", { count: 2 })).toBe(
      "2 Lesezeichen importiert."
    );
    const message = translate(
      "zh-CN",
      'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.',
      {
        directive: "<img>"
      }
    );
    expect(message).not.toContain("{directive}");
    expect(message.match(/<img>/g)).toHaveLength(2);
  });

  test("keeps every locale complete and non-empty", () => {
    Object.values(messages).forEach((locale) => {
      expect(Object.keys(locale)).toEqual(Object.keys(zhCN));
      expect(Object.values(locale).every((value) => value.trim().length > 0)).toBe(true);
    });
  });

  test("keeps sentence-ending punctuation in every locale", () => {
    Object.values(messages).forEach((locale) => {
      Object.entries(locale).forEach((entry) => {
        if (entry[0].endsWith(".")) expect(entry[1]).toMatch(/[.!?。！？]$/);
      });
    });
  });

  test("preserves interpolation placeholders and technical syntax", () => {
    const placeholders = (value: string) =>
      [...value.matchAll(/\{[A-Za-z][A-Za-z0-9]*\}/g)].map((match) => match[0]).sort();
    const tokens = (value: string) =>
      [
        ...value.matchAll(
          /https?:\/\/[^\s`]+|(?:NAV|MTAB)_[A-Za-z0-9_.#]*[A-Za-z0-9_#]|`[^`]+`|<unbound>|a-z/g
        )
      ]
        .map((match) => match[0])
        .sort();

    Object.values(messages).forEach((locale) => {
      Object.keys(zhCN).forEach((key) => {
        const source = key as keyof typeof zhCN;
        expect(placeholders(locale[source])).toEqual(placeholders(source));
        expect(tokens(locale[source])).toEqual(tokens(source));
      });
    });
  });

  test("covers static text and translatable attributes on the settings page", async () => {
    const dom = new JSDOM(await Bun.file("src/options.html").text());
    try {
      const ignored = new Set([
        "nav",
        "/",
        "github",
        "|",
        "v",
        "Discord",
        "🚀",
        "red",
        "sadfjklewcmpgh",
        "2",
        "#14b8a6",
        "#0ea5e9",
        "#eab308",
        "https://duckduckgo.com/?q={}",
        "docs#rules-urls-lists",
        "docs#hotkeys-mappings",
        "docs#hints-directives",
        "docs#hints-advanced-custom-selectors"
      ]);
      const values: string[] = [];
      const walker = dom.window.document.createTreeWalker(
        dom.window.document.documentElement,
        dom.window.NodeFilter.SHOW_TEXT
      );
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        values.push(node.textContent ?? "");
      }
      dom.window.document
        .querySelectorAll("[alt], [aria-label], [placeholder], [title], [data-tippy-content]")
        .forEach((el) => {
          ["alt", "aria-label", "placeholder", "title", "data-tippy-content"].forEach(
            (attribute) => {
              values.push(el.getAttribute(attribute) ?? "");
            }
          );
        });
      expect(
        [
          ...new Set(values.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean))
        ].filter((value) => !Object.hasOwn(zhCN, value) && !ignored.has(value))
      ).toEqual([]);
    } finally {
      dom.window.close();
    }
  });

  test("translates document text and attributes while preserving whitespace and input values", async () => {
    const fixture = createDomFixture([
      "<p>  save  </p>",
      '<input aria-label="save options" placeholder="Paste here..." value="save">',
      '<button title="save" data-tippy-content="save"></button>',
      '<img alt="nav logo">',
      "<textarea>custom rules and CSS</textarea>"
    ]);
    try {
      await initialize("de");
      translateDocument();
      expect(document.documentElement.lang).toBe("de");
      expect(document.querySelector("p")?.textContent).toBe(`  ${de.save}  `);
      expect(document.querySelector("input")?.getAttribute("aria-label")).toBe(de["save options"]);
      expect(document.querySelector("input")?.placeholder).toBe(de["Paste here..."]);
      expect(document.querySelector("input")?.value).toBe("save");
      expect(document.querySelector("button")?.title).toBe(de.save);
      expect(document.querySelector("button")?.dataset.tippyContent).toBe(de.save);
      expect(document.querySelector("img")?.alt).toBe(de["nav logo"]);
      expect(document.querySelector("textarea")?.value).toBe("custom rules and CSS");
    } finally {
      fixture.cleanup();
    }
  });

  test("populates the selector and immediately persists valid language changes", async () => {
    const fixture = createDomFixture('<select id="options-language-select"></select>');
    try {
      await initialize("fr");
      const saved: unknown[] = [];
      Object.assign(chrome.storage.local, { set: (value: unknown) => saved.push(value) });
      await initializeI18n();
      const select = document.querySelector("select")!;
      expect(select.options).toHaveLength(10);
      expect(select.value).toBe("fr");
      expect(select.selectedOptions[0].textContent).toBe("🇫🇷  Français");
      select.value = "ko";
      select.dispatchEvent(new window.Event("change"));
      expect(saved).toEqual([{ optionsLanguage: "ko" }]);
      select.value = "invalid";
      select.dispatchEvent(new window.Event("change"));
      expect(saved).toHaveLength(1);
    } finally {
      fixture.cleanup();
    }
  });

  test("centers a custom dropdown arrow instead of using the browser arrow", async () => {
    const fixture = createDomFixture(await Bun.file("src/options.html").text());
    try {
      const style = document.createElement("style");
      style.textContent = await Bun.file("src/options/styles/base.css").text();
      document.head.append(style);
      const select = document.getElementById("options-language-select") as HTMLSelectElement;
      const arrow = select.parentElement?.querySelector(".options-language-select-arrow");
      expect(arrow).not.toBeNull();
      if (!arrow) return;

      expect(getComputedStyle(select).appearance).toBe("none");
      expect(getComputedStyle(select).paddingRight).toBe("2.5rem");
      expect(getComputedStyle(select.parentElement!).position).toBe("relative");
      expect(getComputedStyle(arrow).position).toBe("absolute");
      expect(getComputedStyle(arrow).top).toBe("50%");
      expect(getComputedStyle(arrow).transform).toBe("translateY(-50%)");
      expect(getComputedStyle(arrow).pointerEvents).toBe("none");
      expect(arrow.getAttribute("aria-hidden")).toBe("true");
    } finally {
      fixture.cleanup();
    }
  });

  test("defaults the new options section to expanded for existing preferences", async () => {
    await initialize("en");
    Object.assign(chrome.storage.local, {
      get: (_keys: string[], callback: (data: { optionsData: unknown }) => void) =>
        callback({ optionsData: { sectionsExpanded: { rules: false, hints: false } } })
    });
    const data = await getOptionsData();
    expect(data.sectionsExpanded.options).toBe(true);
    expect(data.sectionsExpanded.rules).toBe(false);
    expect(data.sectionsExpanded.hints).toBe(false);
  });

  test("collapses the options section containing language and restores its saved state", async () => {
    const html = await Bun.file("src/options.html").text();
    const fixture = createDomFixture(html);
    try {
      await initialize("en");
      let stored: unknown = { sectionsExpanded: {} };
      let onSave = () => {};
      Object.assign(chrome.storage.local, {
        get: (_keys: string[], callback: (data: { optionsData: unknown }) => void) =>
          callback({ optionsData: stored }),
        set: (data: { optionsData: OptionsData }, callback: () => void) => {
          stored = structuredClone(data.optionsData);
          callback();
          onSave();
        }
      });
      createCollapseGroups(await getOptionsData());
      const button = document.getElementById("options-collapse-button") as HTMLButtonElement;
      const section = document.getElementById("options-section")!;
      expect(button).not.toBeNull();
      if (!button) return;

      expect(section.contains(document.getElementById("options-language-select"))).toBe(true);
      expect(button.getAttribute("aria-controls")).toBe("options-section");
      expect(button.getAttribute("aria-expanded")).toBe("true");
      const collapsed = new Promise<void>((resolve) => {
        onSave = resolve;
      });
      button.click();
      await collapsed;
      expect(section.classList.contains("hidden")).toBe(true);
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect((await getOptionsData()).sectionsExpanded.options).toBe(false);

      fixture.root.innerHTML = html;
      createCollapseGroups(await getOptionsData());
      const restored = document.getElementById("options-collapse-button") as HTMLButtonElement;
      expect(restored.getAttribute("aria-expanded")).toBe("false");
      expect(document.getElementById("options-section")?.classList.contains("hidden")).toBe(true);
      const expanded = new Promise<void>((resolve) => {
        onSave = resolve;
      });
      restored.click();
      await expanded;
      expect(restored.getAttribute("aria-expanded")).toBe("true");
      expect((await getOptionsData()).sectionsExpanded.options).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test("translates dynamically rendered validation status without injecting markup", async () => {
    const fixture = createDomFixture('<p id="status"></p>');
    try {
      await initialize("de");
      const status = document.getElementById("status") as HTMLParagraphElement;
      setEditorStatus(status, false);
      expect(status.textContent).toBe(de["No errors detected."]);
      setEditorStatus(status, [{ code: "invalid", message: '<img src="x">' }]);
      expect(status.textContent).toContain(de["Contains errors."]);
      expect(status.textContent).toContain('<img src="x">');
      expect(status.querySelector("img")).toBeNull();
    } finally {
      fixture.cleanup();
    }
  });

  test("translates real editor errors in every language without changing editable values", async () => {
    const fixture = createDomFixture(await Bun.file("src/options.html").text());
    try {
      const ui = await import("~/src/options/scripts/ui");
      const rules = await import("~/src/options/scripts/utils/rules-highlight");
      const hints = await import("~/src/options/scripts/utils/hints-inline-highlight");
      const hotkeys = await import("~/src/options/scripts/utils/hotkeys-highlight");
      const pairs =
        await import("~/src/options/scripts/utils/hints-avoid-adjacent-pairs-highlight");
      const bookmarks = await import("~/src/options/scripts/utils/bar-bookmarks-highlight");
      ui.rulesUrlsBlacklistTextareaEl.value = "* [\n+ not-an-action\nx";
      ui.hotkeysMappingsTextareaEl.value = "j not-an-action\nk scroll-down\nk scroll-up";
      ui.hintsCharsetInputEl.value = "a a1";
      ui.hintsReservedLabelsTextareaEl.value = "@unknown a\n@link  a";
      ui.hintsMinLabelLengthInputEl.value = "2";
      ui.hintsCustomSelectorsTextareaEl.value = "* [ {\naa a\n}\n* example {\naa a\naa [\n}";
      ui.hintsAvoidAdjacentPairsTextareaEl.value = "aa aa abc";
      ui.barSearchBookmarksStorageTextareaEl.value = "not a bookmark";

      for (const locale of getLanguages()) {
        await initialize(locale.value);
        rules.syncRulesUrlsHighlight();
        hotkeys.syncHotkeysMappingsHighlight();
        hints.syncHintsCharsetHighlight();
        hints.syncHintsReservedLabelsHighlight();
        hints.syncHintsCustomSelectorsHighlight();
        pairs.syncHintsAvoidAdjacentPairsHighlight();
        bookmarks.syncBarSearchBookmarksStorageHighlight();

        const statuses = [
          ui.rulesUrlsBlacklistStatusEl,
          ui.hotkeysMappingsStatusEl,
          ui.hintsCharsetStatusEl,
          ui.hintsReservedLabelsStatusEl,
          ui.hintsCustomSelectorsStatusEl,
          ui.hintsAvoidAdjacentPairsStatusEl,
          ui.barSearchBookmarksStorageStatusEl
        ];
        statuses.forEach((status) => {
          expect(status.dataset.hasError).toBe("true");
          expect(status.textContent).toContain(t("Contains errors."));
          expect(status.textContent).not.toMatch(
            /\{(?:line|position|char|directive|label|pattern|key|selector|action|mode|sequence|pair)\}/
          );
        });
        expect(ui.hotkeysMappingsStatusEl.textContent).toContain("not-an-action");
        expect(ui.hotkeysMappingsStatusEl.textContent).toContain("<unbound>");
        expect(ui.hintsCustomSelectorsStatusEl.textContent).toContain(
          t('Invalid regex pattern "{pattern}".', { pattern: "[" })
        );
        expect(ui.hintsCustomSelectorsStatusEl.textContent).toContain(
          t('Duplicate custom selector key "{key}" in the same block.', { key: "aa" })
        );
        expect(ui.hintsCustomSelectorsStatusEl.textContent).toContain(
          t('Invalid CSS selector "{selector}".', { selector: "[" })
        );
        expect(ui.rulesUrlsBlacklistTextareaEl.value).toBe("* [\n+ not-an-action\nx");
        expect(ui.hotkeysMappingsTextareaEl.value).toBe(
          "j not-an-action\nk scroll-down\nk scroll-up"
        );
        expect(ui.hintsCharsetInputEl.value).toBe("a a1");
      }
    } finally {
      fixture.cleanup();
    }
  });

  test("initializes settings after translations and storage without top-level await", async () => {
    const source = await Bun.file("src/options/scripts/init.ts").text();
    expect(source).toContain("void Promise.all([initializeI18n(), getConfig(), getOptionsData()])");
    expect(source).not.toMatch(/^await\b/m);
  });
});