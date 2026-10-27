import { describe, expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { migrateOldConfig } from "~/src/utils/migrate-config";
import { DEFAULT_BAR_CUSTOM_CSS, DEFAULT_FIND_CUSTOM_CSS } from "~/src/utils/prompt-css";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import { injectStyles } from "~/src/core/utils/inject-styles";
import { findStyleParams } from "~/src/core/utils/get-ui";

describe("prompt styling", () => {
  test("adds default themes to old configs without changing appearance settings", () => {
    const config = migrateOldConfig(
      {
        ...defaultConfig,
        bar: { color: "#123456", width: 42, textSize: 2 },
        find: { color: "#abcdef", width: 32, textSize: 1 }
      },
      defaultConfig
    );
    expect(config.bar.styling).toBe("default");
    expect(config.bar.customCSS).toBe(DEFAULT_BAR_CUSTOM_CSS);
    expect(config.find.styling).toBe("default");
    expect(config.find.customCSS).toBe(DEFAULT_FIND_CUSTOM_CSS);
    expect(config.bar.color).toBe("#123456");
    expect(config.bar.width).toBe(42);
    expect(config.find.textSize).toBe(1);
  });

  test("resolves themes independently and preserves an intentionally empty custom theme", async () => {
    const fixture = createDomFixture("");
    try {
      const { buildFastConfig } = await import("~/src/utils/fast-config");
      const config = structuredClone(defaultConfig);
      config.bar.customCSS = ":scope { background: red; }";
      config.find.customCSS = "";
      expect(buildFastConfig(config).bar.css).toBe(DEFAULT_BAR_CUSTOM_CSS);
      config.bar.styling = "custom";
      expect(buildFastConfig(config).bar.css).toBe(config.bar.customCSS);
      expect(buildFastConfig(config).find.css).toBe(DEFAULT_FIND_CUSTOM_CSS);
      config.find.styling = "custom";
      expect(buildFastConfig(config).find.css).toBe("");
      expect(migrateOldConfig(config, defaultConfig).find.customCSS).toBe("");
    } finally {
      fixture.cleanup();
    }
  });

  test("saves editor contents independently and keeps edits when toggling themes", async () => {
    const fixture = createDomFixture(await Bun.file("src/options.html").text());
    try {
      const controls = await import("~/src/options/scripts/utils/prompt-styling");
      const config = structuredClone(defaultConfig);
      controls.barStylingControls.init();
      controls.findStylingControls.init();
      controls.barStylingControls.fill(config.bar);
      controls.findStylingControls.fill(config.find);
      const bar = document.getElementById("bar-custom-css-textarea") as HTMLTextAreaElement;
      const find = document.getElementById("find-custom-css-textarea") as HTMLTextAreaElement;
      bar.value = ":scope { background: red; }";
      find.value = ":scope { background: blue; }";
      document.getElementById("bar-styling-custom-button")!.click();
      document.getElementById("find-styling-custom-button")!.click();
      document.getElementById("bar-styling-default-button")!.click();
      controls.barStylingControls.save(config.bar);
      controls.findStylingControls.save(config.find);
      expect(config.bar.styling).toBe("default");
      expect(config.bar.customCSS).toBe(bar.value);
      expect(config.find.styling).toBe("custom");
      expect(config.find.customCSS).toBe(find.value);
      expect(document.getElementById("bar-custom-css-section")!.classList.contains("hidden")).toBe(
        true
      );
      document.getElementById("bar-styling-custom-button")!.click();
      expect(bar.value).toBe(config.bar.customCSS);
      bar.value = "<script>alert(1)</script>";
      bar.dispatchEvent(new window.Event("input"));
      expect(
        document.getElementById("bar-custom-css-highlight")!.querySelector("script")
      ).toBeNull();
      expect(document.getElementById("bar-custom-css-highlight")!.textContent).toBe(bar.value);
      controls.barStylingControls.fill(defaultConfig.bar);
      expect(bar.value).toBe(DEFAULT_BAR_CUSTOM_CSS);
    } finally {
      fixture.cleanup();
    }
  });

  test("exports only resolved match colors to the webpage, replacing previous styles", () => {
    const fixture = createDomFixture("");
    try {
      const host = document.createElement("div");
      document.body.append(host);
      const root = host.attachShadow({ mode: "open" });
      const status = document.createElement("div");
      status.id = findStyleParams.findStatusId;
      status.style.setProperty("--nav-find-match-background", "#123456");
      status.style.setProperty("--nav-find-current-match-background", "not-a-color");
      status.style.setProperty("--nav-find-match-color", "red; } body { display: none");
      root.append(status);
      const params = {
        focusStyleId: "focus-test",
        focus: {
          overlayId: "focus",
          overlayPositionStyleId: "position",
          fadeOutMs: 220,
          durationMs: 1000,
          activationIndicatorColor: "red",
          colorToRgba: () => "red"
        },
        findStyleId: "find-test",
        findRoot: root,
        find: {
          ...findStyleParams,
          barCSS: "body { --custom-bar: 1; }",
          findCSS: "* { --custom-find: 1; }"
        }
      };
      injectStyles(params);
      const global = document.getElementById("find-test-global")!;
      expect(global.textContent).toContain("::highlight(");
      expect(global.textContent).toContain("rgb(18, 52, 86)");
      expect(global.textContent).not.toContain("--custom-");
      expect(global.textContent).not.toContain("not-a-color");
      expect(global.textContent).not.toContain("body");
      expect(global.textContent).toContain(findStyleParams.findCurrentHighlightBackgroundColor);
      expect(global.textContent).toContain(findStyleParams.findHighlightTextColor);
      expect(status.children.length).toBe(0);
      status.style.removeProperty("--nav-find-match-background");
      injectStyles(params);
      expect(global.textContent).not.toContain("rgb(18, 52, 86)");
      expect(document.querySelectorAll("#find-test-global").length).toBe(1);
    } finally {
      fixture.cleanup();
    }
  });
});