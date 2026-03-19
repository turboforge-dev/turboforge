# @turboforge/sync <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/>

> The authoritative synchronization engine for Turboforge monorepos.

<p className="flex gap-2">
  <a href="https://github.com/turboforge-dev/turboforge/actions/workflows/ci.yml" rel="noopener noreferrer">
    <img alt="CI" src="https://github.com/turboforge-dev/turboforge/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://codecov.io/gh/turboforge-dev/turboforge/tree/main/packages/forge-sync" rel="noopener noreferrer">
    <img alt="codecov" src="https://codecov.io/gh/turboforge-dev/turboforge/graph/badge.svg?flag=forge-sync" />
  </a> 
  <a href="https://npmjs.com/package/forge-sync" rel="noopener noreferrer">
    <img alt="npm version" src="https://img.shields.io/npm/v/forge-sync" />
  </a>
  <a href="https://npmjs.com/package/forge-sync" rel="noopener noreferrer">
    <img alt="npm downloads" src="https://img.shields.io/npm/d18m/forge-sync" />
  </a>
  <a href="https://npmjs.com/package/forge-sync" rel="noopener noreferrer">
    <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/forge-sync" />
  </a>
  <img alt="license" src="https://img.shields.io/npm/l/forge-sync" />
</p>

## ✨ Features

- **Intelligent Template Sync**: Seamlessly pull updates from upstream templates into existing monorepos.
- **Smart Dependency Merging**: SemVer-aware resolution for `package.json` to prevent dependency drift.
- **Three-Way Merge Strategy**: Applies template patches while preserving custom local modifications.
- **Dry Run Verification**: Preview all proposed changes and file patches before execution.
- **Persistent Configuration**: Manage sync settings via `forge-sync.config.json` or CLI flags.
- **Safety First**: Integrated git-tree validation ensures zero data loss during synchronization.

## 📦 Installation

To use it as a CLI tool in your project:

```bash
pnpm add -D @turboforge/sync
```

Or run it directly with `npx`:

```bash
npx @turboforge/sync
```

## 🚀 Usage

Run the sync command from the root of your monorepo to align with the latest template.

```bash
pnpm forge-sync
```

### Dry Run

Preview changes without modifying any files on disk.

```bash
pnpm forge-sync --dry-run
```

### Excluding Paths

Ignore specific directories or files that have been heavily customized.

```bash
pnpm forge-sync --exclude "apps/docs,tooling/custom-script.ts"
```

## 🔧 Configuration

Create a `forge-sync.config.json` in your project root for persistent settings.

```json
{
  "templateUrl": "https://github.com/turboforge-dev/forge-template.git",
  "excludePaths": [
    "pnpm-lock.yaml",
    "apps/web/public"
  ],
  "postSync": [
    "pnpm install",
    "pnpm format"
  ]
}
```

## 🧠 How it Works

1. **Safety Check**: Verifies the current working directory is clean.
2. **Fetch**: Adds the template as a temporary remote and fetches the target reference.
3. **Diff**: Calculates the difference between the last sync point and the target template state.
4. **Patch**: Generates and applies a git patch using a 3-way merge strategy.
5. **Conflict Resolution**: Employs specialized logic for `package.json` to merge dependencies using SemVer rules.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/turboforge-dev/turboforge/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

MIT © [Mayank Kumar Chaudhari](https://mayankchaudhari.com)

