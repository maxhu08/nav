# Setup

## Requirements

- Node.js `>= 25`
- Bun
- zip `>= 3.0`

## Install Tools

### Windows

- Node.js: https://nodejs.org/en/download
- Bun: https://bun.sh/docs/installation

### macOS (Homebrew)

```sh
brew update
brew install node zip
brew install oven-sh/bun/bun
```

### Linux (Arch)

```sh
paru -S nodejs npm zip
npm i -g bun
```

## Project Setup

```sh
git clone https://github.com/maxhu08/nav
cd nav
bun install
```

## Common Commands

- Dev build: `bun run dev` or `bun run dev:firefox`
- Production builds: `bun run build:chrome`, `bun run build:firefox`
- Windows Firefox build alias: `bun run build:firefox:windows`
- Package zips: `bun run package:chrome`, `bun run package:firefox`
- Release candidate packages: `bun run rc:chrome`, `bun run rc:firefox`
- Source package zip: `bun run package:source`
- Validate changes: `bun run check`
- Run tests: `bun run test`
- Format code: `bun run format`

## Load Extension Locally

### Chromium-based browsers

1. Run `bun run dev` or `bun run build:chrome`.
2. Open the browser's extensions page.
3. Enable Developer Mode.
4. Click "Load unpacked".
5. Select the generated `dist/` directory.

### Firefox

1. Run `bun run dev:firefox` or `bun run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on...".
4. Choose `dist/manifest.json`.
