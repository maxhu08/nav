import { describe, expect, test } from "bun:test";
import { defaultConfig } from "~/src/utils/config";
import { migrateOldConfig } from "~/src/utils/migrate-config";

describe("migrateOldConfig", () => {
  test("adds the share directive for configs before v1.0.8", () => {
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
  });

  test("does not duplicate the share directive when it already exists", () => {
    const config = structuredClone(defaultConfig);

    const migratedConfig = migrateOldConfig(config, defaultConfig);
    const shareDirectiveMatches = migratedConfig.hints.reservedLabels.match(/^@share /gm) ?? [];

    expect(shareDirectiveMatches).toHaveLength(1);
  });
});