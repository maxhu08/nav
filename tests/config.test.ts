import { describe, expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { VALID_ACTION_NAMES } from "~/src/utils/hotkeys";
import { RESERVED_HINT_DIRECTIVES } from "~/src/utils/hint-reserved-label-directives";
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
      expect(migratedConfig.hotkeys.mappings).toContain("j scroll-down");
      expect(migratedConfig.hotkeys.mappings).toContain("<unbound> scroll-up");
      expect(migratedConfig.hints.directives).toBe(defaultConfig.hints.directives);
      expect(migratedConfig.hints.styling).toBe(defaultConfig.hints.styling);
    }
  },
  {
    desc: "adds missing directives as unbound during migration",
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

      expect(migratedConfig.hints.directives).toContain("@input kj kjf kjfd");
      expect(migratedConfig.hints.directives).toContain("@attach up");
      expect(migratedConfig.hints.directives).toContain("@home sd sdf sdfj");

      for (const directive of RESERVED_HINT_DIRECTIVES) {
        expect(migratedConfig.hints.directives).toContain(`@${directive} `);
      }

      expect(migratedConfig.hints.directives).toContain("@share <unbound>");
      expect(migratedConfig.hints.directives).toContain("@notification <unbound>");
    }
  },
  {
    desc: "renames legacy activation indicator hint settings during migration",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          activationIndicator: undefined,
          showActivationIndicator: false,
          showActivationIndicatorColor: "rebeccapurple"
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hints.activationIndicator.enabled).toBe(false);
      expect(migratedConfig.hints.activationIndicator.color).toBe("rebeccapurple");
      expect("showActivationIndicator" in migratedConfig.hints).toBe(false);
      expect("showActivationIndicatorColor" in migratedConfig.hints).toBe(false);
    }
  },
  {
    desc: "renames legacy activation indicator hint settings for configs before v1.1.4",
    test: () => {
      const oldConfig = {
        rules: {
          forceNormalMode: true,
          urls: {
            mode: "blacklist",
            blacklist: "",
            whitelist: ""
          }
        },
        hotkeys: {
          mappings: "j scroll-down"
        },
        hints: {
          reservedLabels: "@input kj",
          showActivationIndicator: false,
          showActivationIndicatorColor: "tomato"
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hints.activationIndicator.enabled).toBe(false);
      expect(migratedConfig.hints.activationIndicator.color).toBe("tomato");
      expect(migratedConfig.hints.directives).toBe(defaultConfig.hints.directives);
      expect(migratedConfig.hints.styling).toBe(defaultConfig.hints.styling);
    }
  },
  {
    desc: "adds missing hotkey mappings as unbound during migration",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hotkeys: {
          mappings: "j scroll-down"
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hotkeys.mappings).toContain("j scroll-down");

      for (const actionName of VALID_ACTION_NAMES) {
        expect(migratedConfig.hotkeys.mappings).toContain(actionName);
      }

      expect(migratedConfig.hotkeys.mappings).toContain("<unbound> yank-current-tab-url-clean");
      expect(migratedConfig.hotkeys.mappings).toContain("<unbound> duplicate-current-tab-origin");
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