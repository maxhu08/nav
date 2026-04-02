import { describe, expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { RESERVED_HINT_DIRECTIVES } from "~/src/utils/hint-reserved-label-directives";
import { createDomFixture } from "~/tests/helpers/dom-fixture";

const installCanvasStub = (): void => {
  const prototype = window.HTMLCanvasElement.prototype as { getContext?: unknown };

  prototype.getContext = ((contextId: string) => {
    if (contextId !== "2d") {
      return null;
    }

    return { fillStyle: "" };
  }) as HTMLCanvasElement["getContext"];
};

describe("buildFastConfig", () => {
  test("keeps hotkey mappings empty when the user removes them", async () => {
    const config = structuredClone(defaultConfig);
    config.hotkeys.mappings = "";
    const fixture = createDomFixture("");
    installCanvasStub();
    const { buildFastConfig } = await import("~/src/utils/fast-config");

    const fastConfig = buildFastConfig(config);

    fixture.cleanup();

    expect(fastConfig.hotkeys.mappings).toEqual({});
    expect(fastConfig.hotkeys.prefixes).toEqual({});
  });

  test("keeps hint directives empty when the user removes them", async () => {
    const config = structuredClone(defaultConfig);
    config.hints.directives = "";
    const fixture = createDomFixture("");
    installCanvasStub();
    const { buildFastConfig } = await import("~/src/utils/fast-config");

    const fastConfig = buildFastConfig(config);

    fixture.cleanup();

    for (const directive of RESERVED_HINT_DIRECTIVES) {
      expect(fastConfig.hints.directives[directive]).toEqual([]);
    }
  });

  test("falls back to default bar and find options when values are invalid", async () => {
    const config = structuredClone(defaultConfig);
    config.bar.color = "";
    config.bar.searchEngineURL = "";
    config.find.color = "";
    const fixture = createDomFixture("");
    installCanvasStub();
    const { buildFastConfig } = await import("~/src/utils/fast-config");

    const fastConfig = buildFastConfig(config);

    fixture.cleanup();

    expect(fastConfig.bar.color).toBe(defaultConfig.bar.color);
    expect(fastConfig.bar.searchEngineURL).toBe(defaultConfig.bar.searchEngineURL);
    expect(fastConfig.find.color).toBe(defaultConfig.find.color);
  });
});