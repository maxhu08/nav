import { expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { migrateOldConfig } from "~/src/utils/migrate-config";
import { parseHotkeyMappingsValue } from "~/src/utils/hotkeys";
import { normalizeToastPayload } from "~/src/shared/runtime-bridge";

test("migration removes obsolete typing-exit options without rewriting other bindings", () => {
  const config = structuredClone(defaultConfig);
  const mappings = "# custom\n  gg scroll-to-top # keep spacing\nyy yank-current-tab-url";
  const legacy = {
    ...config,
    hotkeys: {
      mappings: `${mappings}\n# required insert mode\n<escape> exit-insert-mode\nkj exit-insert-mode # keep comment\n<unbound> exit-insert-mode`,
      insertSequenceTimeout: 120
    }
  };
  for (const input of [
    legacy,
    { ...legacy, rules: { urls: config.rules.urls } },
    { ...legacy, hints: { reservedLabels: {} } }
  ]) {
    const result = migrateOldConfig(input, defaultConfig);
    expect(result.hotkeys).not.toHaveProperty("insertSequenceTimeout");
    expect(result.hotkeys.mappings).toStartWith(`${mappings}\n# keep comment`);
    expect(result.hotkeys.mappings).not.toContain("exit-insert-mode");
    expect(parseHotkeyMappingsValue(result.hotkeys.mappings).errors).toEqual([]);
    expect(migrateOldConfig(result, defaultConfig)).toEqual(result);
  }
});

test("toast proxy preserves short durations and rejects invalid values", () => {
  expect(normalizeToastPayload({ content: "Visual mode", duration: 1000 })?.duration).toBe(1000);
  expect(
    normalizeToastPayload({ content: "Visual mode", duration: Infinity })?.duration
  ).toBeUndefined();
});