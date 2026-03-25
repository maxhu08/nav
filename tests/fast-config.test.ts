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

  test("keeps reserved hint labels empty when the user removes them", async () => {
    const config = structuredClone(defaultConfig);
    config.hints.reservedLabels = "";
    const fixture = createDomFixture("");
    installCanvasStub();
    const { buildFastConfig } = await import("~/src/utils/fast-config");

    const fastConfig = buildFastConfig(config);

    fixture.cleanup();

    for (const directive of RESERVED_HINT_DIRECTIVES) {
      expect(fastConfig.hints.reservedLabels[directive]).toEqual([]);
    }
  });
});