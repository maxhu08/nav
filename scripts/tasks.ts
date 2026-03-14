import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type BrowserTarget = "chrome" | "firefox";
type TaskName = "clean" | "dev" | "build" | "package" | "rc" | "source";

const ROOT = process.cwd();
const DIST_DIR = resolve(ROOT, "dist");
const OUTPUT_DIR = resolve(ROOT, "output");
const SRC_DIR = resolve(ROOT, "src");
const STATIC_DIR = resolve(SRC_DIR, "static");
const DIST_CORE_DIR = resolve(DIST_DIR, "core");
const DEBUG_MAIN_BUNDLE_PATH = "debug/debug-main.js";
const ENTRY_FILES = [
  resolve(ROOT, "src", "background.ts"),
  resolve(ROOT, "src", "core", "index.ts"),
  resolve(ROOT, "src", "core", "debug", "debug-main.ts"),
  resolve(ROOT, "src", "popup.html"),
  resolve(ROOT, "src", "options.html"),
  resolve(ROOT, "src", "docs.html")
];
const VERSION_FILE = resolve(ROOT, "EXTENSION_VERSION.txt");

const MANIFESTS: Record<BrowserTarget, Record<string, unknown>> = {
  chrome: {
    manifest_version: 3,
    name: "nav",
    author: "Max Hu",
    description: "vim style keyboard navigation for the web",
    permissions: ["storage", "tabs"],
    background: {
      service_worker: "background.js"
    },
    host_permissions: ["<all_urls>"],
    action: {
      default_popup: "popup.html"
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["index.js"],
        run_at: "document_start",
        all_frames: true,
        match_about_blank: true
      }
    ],
    web_accessible_resources: [
      {
        resources: ["shared/fonts/*.woff2"],
        matches: ["<all_urls>"]
      }
    ],
    icons: {
      16: "16.png",
      32: "32.png",
      48: "48.png",
      64: "64.png",
      128: "128.png"
    }
  },
  firefox: {
    manifest_version: 3,
    name: "nav",
    author: "Max Hu",
    description: "vim style keyboard navigation for the web",
    permissions: ["storage", "tabs"],
    background: {
      service_worker: "background.js",
      scripts: ["background.js"]
    },
    host_permissions: ["<all_urls>"],
    action: {
      default_popup: "popup.html"
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["index.js"],
        run_at: "document_start",
        all_frames: true,
        match_about_blank: true
      }
    ],
    web_accessible_resources: [
      {
        resources: ["shared/fonts/*.woff2"],
        matches: ["<all_urls>"]
      }
    ],
    icons: {
      16: "16.png",
      32: "32.png",
      48: "48.png",
      64: "64.png",
      128: "128.png"
    },
    browser_specific_settings: {
      gecko: {
        id: "nav-extension@maxhu.dev",
        data_collection_permissions: {
          required: ["none"]
        }
      }
    }
  }
};

async function main() {
  const [taskArg, targetArg, versionArg] = process.argv.slice(2);
  const task = parseTask(taskArg);

  if (task === "clean") {
    clean();
    return;
  }

  if (task === "source") {
    packageSource();
    return;
  }

  const target = parseTarget(targetArg);

  switch (task) {
    case "dev":
      clean();
      ensureDist();
      syncStaticFiles();
      writeManifest(target, readVersion(), undefined, true);
      runParcel("watch", true);
      return;
    case "build":
      clean();
      buildBundle(target);
      return;
    case "package":
      clean();
      buildBundle(target);
      pruneDevOnlyBuildArtifacts();
      packageBundle(target);
      return;
    case "rc": {
      const rcVersion = versionArg ?? (await promptForRcVersion());
      const release = parseRcVersion(rcVersion);

      clean();
      buildBundle(target, release.baseVersion);
      pruneDevOnlyBuildArtifacts();
      annotateRcBuild(target, release.rcVersion);
      packageBundle(target, {
        packageVersion: release.rcVersion,
        zipVersion: release.rcVersion
      });
      return;
    }
  }
}

function parseTask(value: string | undefined): TaskName {
  if (
    value === "clean" ||
    value === "dev" ||
    value === "build" ||
    value === "package" ||
    value === "rc" ||
    value === "source"
  ) {
    return value;
  }

  throw new Error(
    "Usage: bun run ./scripts/tasks.ts <clean|dev|build|package|rc|source> [chrome|firefox] [rc-version]"
  );
}

function parseTarget(value: string | undefined): BrowserTarget {
  if (value === "chrome" || value === "firefox") {
    return value;
  }

  throw new Error("Expected browser target: chrome or firefox");
}

function clean() {
  rmSync(resolve(ROOT, ".parcel-cache"), { force: true, recursive: true });
  rmSync(DIST_DIR, { force: true, recursive: true });
}

function buildBundle(target: BrowserTarget, version = readVersion()) {
  ensureDist();
  runParcel("build", false);
  flattenDistCoreDirectory();
  syncStaticFiles();
  writeManifest(target, version, undefined, false);
}

function ensureDist() {
  mkdirSync(DIST_DIR, { recursive: true });
}

function syncStaticFiles() {
  copyDirectoryContents(STATIC_DIR, DIST_DIR);
}

function flattenDistCoreDirectory() {
  if (!existsSync(DIST_CORE_DIR)) {
    return;
  }

  for (const entry of readdirSync(DIST_CORE_DIR)) {
    const destination = resolve(DIST_DIR, entry);
    rmSync(destination, { force: true, recursive: true });
    renameSync(resolve(DIST_CORE_DIR, entry), destination);
  }

  rmSync(DIST_CORE_DIR, { force: true, recursive: true });
}

function writeManifest(
  target: BrowserTarget,
  version = readVersion(),
  versionName?: string,
  isDev = false
) {
  const manifest = structuredClone(MANIFESTS[target]);

  if (isDev && target === "chrome") {
    const contentScripts = manifest.content_scripts as Array<Record<string, unknown>>;
    contentScripts.push({
      matches: ["<all_urls>"],
      js: [DEBUG_MAIN_BUNDLE_PATH],
      run_at: "document_start",
      all_frames: true,
      match_about_blank: true,
      world: "MAIN"
    });
  }

  const withVersion = {
    ...manifest,
    version,
    ...(versionName ? { version_name: versionName } : {})
  };

  writeFileSync(resolve(DIST_DIR, "manifest.json"), `${JSON.stringify(withVersion, null, 2)}\n`);
}

function readVersion() {
  return readFileSync(VERSION_FILE, "utf8").trim();
}

function runParcel(mode: "build" | "watch", isDev: boolean) {
  const args = ["x", "parcel"];
  const env = {
    ...process.env,
    NAV_DEV: isDev ? "true" : "false"
  };

  if (mode === "build") {
    args.push(
      "build",
      ...ENTRY_FILES,
      "--dist-dir",
      DIST_DIR,
      "--no-source-maps",
      "--no-content-hash"
    );
    runCommand(process.execPath, args, ROOT, env);
    return;
  }

  args.push("watch", ...ENTRY_FILES, "--dist-dir", DIST_DIR, "--no-content-hash");
  const flattenInterval = setInterval(() => {
    flattenDistCoreDirectory();
  }, 100);
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: "inherit", env });

  child.on("exit", (code) => {
    clearInterval(flattenInterval);
    flattenDistCoreDirectory();
    process.exit(code ?? 0);
  });
}

function packageBundle(
  target: BrowserTarget,
  options: {
    packageVersion?: string;
    zipVersion?: string;
    dirSuffix?: string;
    zipSuffix?: string;
  } = {}
) {
  const packageVersion = options.packageVersion ?? readVersion();
  const zipVersion = options.zipVersion ?? packageVersion;
  const dirSuffix = options.dirSuffix ?? "";
  const zipSuffix = options.zipSuffix ?? dirSuffix;
  const packageDirName = `nav-v${packageVersion}-${target}${dirSuffix}`;
  const packageZipName = `nav-v${zipVersion}-${target}${zipSuffix}.zip`;
  const packageDir = resolve(OUTPUT_DIR, packageDirName);
  const zipPath = resolve(OUTPUT_DIR, packageZipName);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  rmSync(packageDir, { force: true, recursive: true });
  rmSync(zipPath, { force: true });
  cpSync(DIST_DIR, packageDir, { recursive: true });

  if (!existsSync(resolve(packageDir, "index.js"))) {
    throw new Error("Missing expected build output: dist/index.js");
  }

  runCommand("zip", ["-r", "-FS", zipPath, "."], packageDir);

  console.log(`Build complete\nExtension: ${packageDir}\nZip: ${zipPath}`);
}

function pruneDevOnlyBuildArtifacts() {
  if (!existsSync(DIST_DIR)) {
    return;
  }

  rmSync(resolve(DIST_DIR, "debug"), { force: true, recursive: true });

  for (const entry of readdirSync(DIST_DIR)) {
    if (/^nav-debug\..+\.js$/.test(entry)) {
      rmSync(resolve(DIST_DIR, entry), { force: true });
    }

    if (/^debug-main(?:\..+)?\.js$/.test(entry)) {
      rmSync(resolve(DIST_DIR, entry), { force: true });
    }
  }
}

function packageSource() {
  const version = readVersion();
  const zipPath = resolve(OUTPUT_DIR, `nav-v${version}-source.zip`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  rmSync(zipPath, { force: true });

  runCommand("zip", [
    "-r",
    "-FS",
    zipPath,
    ".",
    "-x",
    "*.git*",
    "-x",
    "node_modules/*",
    "-x",
    ".parcel-cache/*",
    "-x",
    "dist/*",
    "-x",
    "output/*"
  ]);

  console.log(`Source package complete\nZip: ${zipPath}`);
}

function runCommand(
  command: string,
  args: string[],
  cwd = ROOT,
  env: NodeJS.ProcessEnv = process.env
) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function copyDirectoryContents(sourceDir: string, destinationDir: string) {
  if (!existsSync(sourceDir)) {
    return;
  }

  for (const entry of readdirSync(sourceDir)) {
    cpSync(resolve(sourceDir, entry), resolve(destinationDir, entry), {
      force: true,
      recursive: true
    });
  }
}

function annotateRcBuild(target: BrowserTarget, rcVersion: string) {
  writeManifest(target, parseRcVersion(rcVersion).baseVersion, rcVersion);
}

async function promptForRcVersion() {
  const rl = createInterface({ input, output });

  try {
    return await rl.question("Enter release candidate version (example: 0.0.1-rc1): ");
  } finally {
    rl.close();
  }
}

function parseRcVersion(value: string) {
  const rcVersion = value.trim();
  const match = /^([0-9]+\.[0-9]+\.[0-9]+)-rc([0-9A-Za-z.-]*)$/.exec(rcVersion);

  if (!match) {
    throw new Error("Invalid RC version. Expected format like 0.1.0-rc1.");
  }

  return {
    baseVersion: match[1],
    rcVersion
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});