import { afterEach, describe, expect, mock, test } from "bun:test";
import { JSDOM } from "jsdom";

const pages: JSDOM[] = [];

const createPage = async (options: { navigation?: string; top?: string; layout?: string } = {}) => {
  const dom = new JSDOM(await Bun.file("src/options.html").text(), {
    url: "https://example.com/options.html",
    runScripts: "outside-only"
  });
  pages.push(dom);
  const window = dom.window;
  const scroll = mock(() => {});
  window.scrollTo = scroll;
  window.history.scrollRestoration = "auto";
  Object.defineProperty(window.performance, "getEntriesByType", {
    value: () => [{ type: options.navigation ?? "reload" }]
  });
  // JSDOM has no CSS.escape; every ID in the options page is already a valid identifier.
  Object.defineProperty(window, "CSS", { value: { escape: (id: string) => id } });
  if (options.top !== undefined) window.sessionStorage.setItem("options-scroll", options.top);
  if (options.layout !== undefined) {
    window.sessionStorage.setItem("options-layout", options.layout);
  }

  const style = window.document.createElement("style");
  style.textContent =
    ".grid { display: grid; } .hidden { display: none; }\n" +
    (await Bun.file("src/options/styles/index.css").text());
  window.document.head.appendChild(style);
  window.eval(
    new Bun.Transpiler({ loader: "ts" }).transformSync(
      await Bun.file("src/options/scripts/loading.ts").text()
    )
  );
  return { window, scroll };
};

afterEach(() => {
  pages.splice(0).forEach((page) => page.window.close());
});

describe("options loading", () => {
  test("applies the layout hint with a blocking head script before initialization", async () => {
    const dom = new JSDOM(await Bun.file("src/options.html").text());
    pages.push(dom);
    const document = dom.window.document;
    expect(document.documentElement.classList.contains("options-initializing")).toBe(true);
    expect(document.querySelector(".options-page-layout main")).not.toBeNull();
    const scripts = Array.from(document.head.querySelectorAll("script"));
    const loading = scripts.find((script) => script.getAttribute("src")?.endsWith("/loading.ts"));
    expect(loading).toBeDefined();
    expect(loading?.hasAttribute("type")).toBe(false);
    expect(loading?.hasAttribute("defer")).toBe(false);
    expect(loading?.hasAttribute("async")).toBe(false);
    expect(scripts.indexOf(loading!)).toBeLessThan(
      scripts.findIndex((script) => script.getAttribute("src")?.endsWith("/init.ts"))
    );
  });

  test("reserves cached height and visibility only during initialization", async () => {
    const page = await createPage({
      layout:
        ":root.options-initializing body { min-height: 4800px !important; }\n" +
        ":root.options-initializing #rules-section { height: 320px !important; }\n" +
        ":root.options-initializing #rules-urls-whitelist-section { display: none !important; }"
    });
    const document = page.window.document;
    const section = document.getElementById("rules-section")!;
    const hidden = document.getElementById("rules-urls-whitelist-section")!;
    expect(page.window.getComputedStyle(document.body).minHeight).toBe("4800px");
    expect(page.window.getComputedStyle(section).height).toBe("320px");
    expect(page.window.getComputedStyle(hidden).display).toBe("none");
    expect(page.window.getComputedStyle(document.documentElement).overflowAnchor).toBe("none");

    document.documentElement.classList.remove("options-initializing");
    expect(page.window.getComputedStyle(document.body).minHeight).not.toBe("4800px");
    expect(page.window.getComputedStyle(section).height).not.toBe("320px");
    expect(page.window.getComputedStyle(hidden).display).toBe("grid");
  });

  test("caches the settled layout and scroll on pagehide", async () => {
    const page = await createPage();
    const document = page.window.document;
    document.documentElement.classList.remove("options-initializing");
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 4800 });
    Object.defineProperty(page.window, "scrollY", { value: 900 });
    document.getElementById("rules-section")!.getBoundingClientRect = () =>
      new page.window.DOMRect(0, 0, 640, 320);
    document.getElementById("rules-urls-whitelist-section")!.classList.replace("grid", "hidden");
    page.window.dispatchEvent(new page.window.Event("pagehide"));

    const layout = page.window.sessionStorage.getItem("options-layout");
    expect(layout).toContain("min-height: 4800px !important;");
    expect(layout).toContain(
      "#rules-section { display: grid !important; height: 320px !important; }"
    );
    expect(layout).toContain("#rules-urls-whitelist-section { display: none !important;");
    expect(layout).not.toContain("#toaster-wrapper");
    expect(page.window.sessionStorage.getItem("options-scroll")).toBe("900");
  });

  test("does not overwrite the settled snapshot when refreshed during initialization", async () => {
    const page = await createPage({ layout: "/* settled layout */", top: "900" });
    Object.defineProperty(page.window, "scrollY", { value: 0 });
    page.window.dispatchEvent(new page.window.Event("pagehide"));
    expect(page.window.sessionStorage.getItem("options-layout")).toBe("/* settled layout */");
    expect(page.window.sessionStorage.getItem("options-scroll")).toBe("900");
  });

  test("restores scroll at DOMContentLoaded and options-ready on reload", async () => {
    const page = await createPage({ top: "900" });
    expect(page.window.history.scrollRestoration).toBe("manual");
    expect(page.scroll).not.toHaveBeenCalled();
    page.window.document.dispatchEvent(new page.window.Event("DOMContentLoaded"));
    expect(page.scroll).toHaveBeenCalledTimes(1);
    expect(page.scroll).toHaveBeenLastCalledWith({ top: 900, behavior: "instant" });
    page.window.dispatchEvent(new page.window.Event("options-ready"));
    expect(page.scroll).toHaveBeenCalledTimes(2);
    expect(page.scroll).toHaveBeenLastCalledWith({ top: 900, behavior: "instant" });
    expect(page.window.history.scrollRestoration).toBe("auto");
    page.window.dispatchEvent(new page.window.Event("options-ready"));
    expect(page.scroll).toHaveBeenCalledTimes(2);
  });

  test.each(["wheel", "touchmove", "pointerdown", "keydown"])(
    "%s cancels subsequent scroll restoration",
    async (event) => {
      const page = await createPage({ top: "900" });
      page.window.document.dispatchEvent(new page.window.Event("DOMContentLoaded"));
      expect(page.scroll).toHaveBeenCalledTimes(1);
      page.window.dispatchEvent(new page.window.Event(event));
      page.window.dispatchEvent(new page.window.Event("options-ready"));
      expect(page.scroll).toHaveBeenCalledTimes(1);
      expect(page.window.history.scrollRestoration).toBe("auto");
    }
  );

  test.each(["navigate", "back_forward"])(
    "leaves native scroll restoration alone on %s",
    async (navigation) => {
      const page = await createPage({ navigation, top: "900" });
      page.window.document.dispatchEvent(new page.window.Event("DOMContentLoaded"));
      page.window.dispatchEvent(new page.window.Event("options-ready"));
      expect(page.scroll).not.toHaveBeenCalled();
      expect(page.window.history.scrollRestoration).toBe("auto");
    }
  );

  test("leaves native scroll restoration alone without a saved position", async () => {
    const page = await createPage();
    page.window.document.dispatchEvent(new page.window.Event("DOMContentLoaded"));
    page.window.dispatchEvent(new page.window.Event("options-ready"));
    expect(page.scroll).not.toHaveBeenCalled();
    expect(page.window.history.scrollRestoration).toBe("auto");
  });
});