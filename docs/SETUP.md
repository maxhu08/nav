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
- Package zips: `bun run package:chrome`, `bun run package:firefox`
- Release candidate packages: `bun run rc:chrome`, `bun run rc:firefox`
- Source package zip: `bun run package:source`
- Validate changes: `bun run check`
- Format code: `bun run format`

## Load Extension Locally

1. Open browser extension settings.
2. Enable Developer Mode.
3. Click "Load unpacked".
4. Select the generated `dist/` directory.
