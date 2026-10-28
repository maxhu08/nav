import { describe, expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { DEFAULT_HOTKEY_MAPPINGS } from "~/src/utils/config-defaults";
import { parseHotkeyMappingsValue } from "~/src/utils/hotkeys";
import { migrateOldConfig } from "~/src/utils/migrate-config";

describe("visual bindings", () => {
  test("default mappings have no missing actions or mode-local conflicts", () => {
    expect(parseHotkeyMappingsValue(DEFAULT_HOTKEY_MAPPINGS).errors).toEqual([]);
  });
  test("upgrades leave entries unbound but populate mode-local defaults idempotently", () => {
    const config = structuredClone(defaultConfig);
    config.hotkeys.mappings = "v watch-mode\nj scroll-down";
    const upgraded = migrateOldConfig(config, defaultConfig);
    const parsed = parseHotkeyMappingsValue(upgraded.hotkeys.mappings);
    expect(parsed.errors).toEqual([]);
    expect(parsed.mappings.v).toEqual({ normal: "watch-mode", visual: "visual-character" });
    expect(parsed.mappings.V).toEqual({ visual: "visual-line" });
    expect(parsed.mappings.gv).toBeUndefined();
    expect(upgraded.hotkeys.mappings).toContain("<unbound> visual-mode");
    expect(upgraded.hotkeys.mappings).toContain("<unbound> visual-line-mode");
    expect(upgraded.hotkeys.mappings).toContain("<unbound> visual-restore");
    expect(migrateOldConfig(upgraded, defaultConfig)).toEqual(upgraded);
  });
  test("migration preserves custom visual bindings, explicit unbindings and occupied sequences", () => {
    const config = structuredClone(defaultConfig);
    config.hotkeys.mappings = "<unbound> visual-left\nz visual-right\nh visual-up";
    const upgraded = migrateOldConfig(config, defaultConfig);
    const parsed = parseHotkeyMappingsValue(upgraded.hotkeys.mappings);
    expect(parsed.errors).toEqual([]);
    expect(parsed.mappings["<left>"]).toBeUndefined();
    expect(parsed.mappings.z?.visual).toBe("visual-right");
    expect(parsed.mappings.l).toBeUndefined();
    expect(parsed.mappings.h?.visual).toBe("visual-up");
  });
});