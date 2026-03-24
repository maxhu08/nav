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
  },
  {
    desc: "adds the microphone directive for configs before v1.1.1",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          reservedLabels: `@input kj kjf kjfd
@attach up
@share sh
@download dl
@login si
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

      expect(migratedConfig.hints.reservedLabels).toContain("@microphone mic");
      expect(migratedConfig.hints.reservedLabels).toContain("@login si");
    }
  },
  {
    desc: "adds the copy directive for configs before v1.1.2",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          reservedLabels: `@input kj kjf kjfd
@attach up
@share sh
@download dl
@login si
@microphone mic
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

      expect(migratedConfig.hints.reservedLabels).toContain("@copy cp");
      expect(migratedConfig.hints.reservedLabels).toContain("@microphone mic");
    }
  },
  {
    desc: "adds the hide directive for configs before v1.1.2",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hints: {
          ...structuredClone(defaultConfig).hints,
          reservedLabels: `@input kj kjf kjfd
@attach up
@share sh
@download dl
@login si
@microphone mic
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

      expect(migratedConfig.hints.reservedLabels).toContain("@hide hi");
      expect(migratedConfig.hints.reservedLabels).toContain("@microphone mic");
    }
  },
  {
    desc: "adds the clean current tab URL hotkey for configs before v1.10.0",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hotkeys: {
          mappings: `# scroll
j scroll-down
k scroll-up
h scroll-left
l scroll-right
d scroll-half-page-down
u scroll-half-page-up
gg scroll-to-top
G scroll-to-bottom

# hints
f hint-mode-current-tab
F hint-mode-new-tab

# tab actions
t create-new-tab
x close-current-tab
r reload-current-tab
R reload-current-tab-hard
J tab-go-prev
K tab-go-next
yt duplicate-current-tab
W move-current-tab-to-new-window

# clipboard
yl yank-link-url
yi yank-image
yI yank-image-url
yy yank-current-tab-url

# misc
H history-go-prev
L history-go-next
[ follow-prev
] follow-next

# find
/ find-mode
n cycle-match-next # requires find mode
N cycle-match-prev # requires find mode

# watch
w watch-mode
f toggle-fullscreen # requires watch mode
e toggle-play-pause # requires watch mode
l toggle-loop # requires watch mode
m toggle-mute # requires watch mode
c toggle-captions # requires watch mode`
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hotkeys.mappings).toContain("yc yank-current-tab-url-clean");
    }
  },
  {
    desc: "adds the current tab origin hotkey for configs before v1.1.1",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hotkeys: {
          mappings: `# scroll
j scroll-down
k scroll-up
h scroll-left
l scroll-right
d scroll-half-page-down
u scroll-half-page-up
gg scroll-to-top
G scroll-to-bottom

# hints
f hint-mode-current-tab
F hint-mode-new-tab

# tab actions
t create-new-tab
x close-current-tab
r reload-current-tab
R reload-current-tab-hard
J tab-go-prev
K tab-go-next
yt duplicate-current-tab
W move-current-tab-to-new-window

# clipboard
yl yank-link-url
yi yank-image
yI yank-image-url
yy yank-current-tab-url
yc yank-current-tab-url-clean

# misc
H history-go-prev
L history-go-next
[ follow-prev
] follow-next

# find
/ find-mode
n cycle-match-next # requires find mode
N cycle-match-prev # requires find mode

# watch
w watch-mode
f toggle-fullscreen # requires watch mode
e toggle-play-pause # requires watch mode
l toggle-loop # requires watch mode
m toggle-mute # requires watch mode
c toggle-captions # requires watch mode`
        }
      };

      const migratedConfig = migrateOldConfig(oldConfig, defaultConfig);

      expect(migratedConfig.hotkeys.mappings).toContain("yo duplicate-current-tab-origin");
    }
  },
  {
    desc: "does not duplicate the microphone directive when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const microphoneDirectiveMatches =
        migratedConfig.hints.reservedLabels.match(/^@microphone /gm) ?? [];

      expect(microphoneDirectiveMatches).toHaveLength(1);
    }
  },
  {
    desc: "does not duplicate the copy directive when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const copyDirectiveMatches = migratedConfig.hints.reservedLabels.match(/^@copy /gm) ?? [];

      expect(copyDirectiveMatches).toHaveLength(1);
    }
  },
  {
    desc: "does not duplicate the hide directive when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const hideDirectiveMatches = migratedConfig.hints.reservedLabels.match(/^@hide /gm) ?? [];

      expect(hideDirectiveMatches).toHaveLength(1);
    }
  },
  {
    desc: "does not duplicate the clean current tab URL hotkey when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const cleanUrlYankMatches =
        migratedConfig.hotkeys.mappings.match(/^yc yank-current-tab-url-clean$/gm) ?? [];

      expect(cleanUrlYankMatches).toHaveLength(1);
    }
  },
  {
    desc: "does not duplicate the current tab origin hotkey when it already exists",
    test: () => {
      const config = structuredClone(defaultConfig);

      const migratedConfig = migrateOldConfig(config, defaultConfig);
      const yoMatches =
        migratedConfig.hotkeys.mappings.match(/^yo duplicate-current-tab-origin$/gm) ?? [];

      expect(yoMatches).toHaveLength(1);
    }
  },
  {
    desc: "renames the old current tab origin action during migration",
    test: () => {
      const oldConfig = {
        ...structuredClone(defaultConfig),
        hotkeys: {
          mappings: `yb duplicate-current-tab-base`
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