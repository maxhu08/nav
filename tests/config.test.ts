import { describe, expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { migrateOldConfig } from "~/src/utils/migrate-config";
import type { ConfigMigrationTestCase } from "~/tests/types";

export const configMigrationTestCases: ConfigMigrationTestCase[] = [
  {
    desc: "adds the share directive for configs before v1.0.8",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          reservedLabels: `@input kj kjf kjfd
@attach up
@home sd sdf sdfj
@sidebar we wer wert
@next kl
@prev lk
@cancel no
@submit ok
@like iu
@dislike oi`
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hints.reservedLabels).toContain("@share sh");
      expect(migratedConfig.hints.reservedLabels).toContain("@attach up");
    }
  },
  {
    desc: "adds the download directive for configs before v1.0.9",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          reservedLabels: `@input kj kjf kjfd
@attach up
@share sh
@home sd sdf sdfj
@sidebar we wer wert
@next kl
@prev lk
@cancel no
@submit ok
@like iu
@dislike oi`
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hints.reservedLabels).toContain("@login si");
      expect(migratedConfig.hints.reservedLabels).toContain("@download dl");
      expect(migratedConfig.hints.reservedLabels).toContain("@share sh");
    }
  },
  {
    desc: "adds the login directive for configs before v1.0.9",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          reservedLabels: `@input kj kjf kjfd
@attach up
@share sh
@download dl
@home sd sdf sdfj
@sidebar we wer wert
@next kl
@prev lk
@cancel no
@submit ok
@like iu
@dislike oi`
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hints.reservedLabels).toContain("@login si");
      expect(migratedConfig.hints.reservedLabels).toContain("@download dl");
    }
  },
  {
    desc: "does not duplicate the share directive when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const shareDirectiveMatches = migratedConfig.hints.reservedLabels.match(/^@share /gm) ?? [];

      expect(shareDirectiveMatches).toHaveLength(1);
    }
  },
  {
    desc: "does not duplicate the download directive when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const downloadDirectiveMatches =
        migratedConfig.hints.reservedLabels.match(/^@download /gm) ?? [];

      expect(downloadDirectiveMatches).toHaveLength(1);
    }
  },
  {
    desc: "does not duplicate the login directive when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const loginDirectiveMatches = migratedConfig.hints.reservedLabels.match(/^@login /gm) ?? [];

      expect(loginDirectiveMatches).toHaveLength(1);
    }
  }
];

describe("migrateOldConfig", () => {
  for (const configMigrationTestCase of configMigrationTestCases) {
    test(configMigrationTestCase.desc, configMigrationTestCase.test);
  }
});