import { describe, expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { migrateOldConfig } from "~/src/utils/migrate-config";
import type { ConfigMigrationTestCase } from "~/tests/types";

export const configMigrationTestCases: ConfigMigrationTestCase[] = [
  {
    desc: "returns fallback config when directives are missing",
    test: () => {
      const migratedConfig = migrateOldConfig({}, defaultConfig);

      expect(migratedConfig).toEqual(defaultConfig);
    }
  },
  {
    desc: "merges fallback config when force normal mode is missing",
    test: () => {
      const oldConfig = {
        rules: {
          urls: {
            mode: "whitelist",
            blacklist: "foo",
            whitelist: "bar"
          }
        },
        hotkeys: {
          mappings: "j scroll-down"
        },
        hints: {
          reservedLabels: "@input kj"
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.rules.forceNormalMode).toBe(defaultConfig.rules.forceNormalMode);
      expect(migratedConfig.rules.urls.mode).toBe("whitelist");
      expect(migratedConfig.hotkeys.mappings).toBe("j scroll-down");
      expect(migratedConfig.hints.directives).toBe(defaultConfig.hints.directives);
    }
  },
  {
    desc: "keeps removed directives removed during migration",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          directives: `@input kj kjf kjfd
@attach up
@home sd sdf sdfj`
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hints.directives).toBe(oldConfig.hints.directives);
      expect(migratedConfig.hints.directives).not.toContain("@share sh");
      expect(migratedConfig.hints.directives).not.toContain("@notification nf");
    }
  },
  {
    desc: "keeps removed hotkey mappings removed during migration",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hotkeys: {
          mappings: "j scroll-down"
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hotkeys.mappings).toBe("j scroll-down");
      expect(migratedConfig.hotkeys.mappings).not.toContain("yc yank-current-tab-url-clean");
      expect(migratedConfig.hotkeys.mappings).not.toContain("yo duplicate-current-tab-origin");
    }
  },
  {
    desc: "renames the old current tab origin action during migration",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hotkeys: {
          mappings: "yb duplicate-current-tab-base"
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hotkeys.mappings).toContain("yo duplicate-current-tab-origin");
      expect(migratedConfig.hotkeys.mappings).not.toContain("yb duplicate-current-tab-origin");
      expect(migratedConfig.hotkeys.mappings).not.toContain("duplicate-current-tab-base");
    }
  }
];

describe("migrateOldConfig", () => {
  for (const configMigrationTestCase of configMigrationTestCases) {
    test(configMigrationTestCase.desc, configMigrationTestCase.test);
  }
});