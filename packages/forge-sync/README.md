# Forge Sync <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/>

<p className="flex gap-2">
  <a href="https://github.com/react18-tools/turbo-forge/actions/workflows/ci.yml" rel="noopener noreferrer">
    <img alt="CI" src="https://github.com/react18-tools/turbo-forge/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://codecov.io/gh/react18-tools/turbo-forge/tree/main/packages/forge-sync" rel="noopener noreferrer">
    <img alt="codecov" src="https://codecov.io/gh/react18-tools/turbo-forge/graph/badge.svg?flag=forge-sync" />
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

> **The authoritative synchronization engine for Turbo-Forge monorepos.**  
> Keep your monorepo's tooling, configurations, and core dependencies in perfect sync with the upstream template.

`forge-sync` automates the complex process of pulling updates from a template repository (like verified `turbo-forge` templates) into your existing project. It handles git operations, generates patches, and intelligently resolves conflicts—especially in `package.json` files.

---

## ✨ Features

- **🛡️ Smart Git Safety**: Automatically checks for a clean git tree before running to prevent data loss.
- **🔄 Three-Way Merge**: Uses advanced 3-way merging to apply template updates while preserving your custom changes.
- **📦 Intelligent Dependency Resolution**: Special logic for `package.json` to merge dependencies using SemVer rules (e.g., picking the higher version) and resolving conflicts automatically.
- **🔍 Dry Run Mode**: Preview exactly what patches will be applied without making any changes.
- **⚙️ Flexible Configuration**: Configure via CLI flags or a persistent `forge-sync.config.json` file.
- **🚫 Exclusion Support**: Easily exclude specific files or directories from being overwritten (e.g., `docs/`, `examples/`).

---

## 📦 Installation

To use it as a CLI tool in your project:

```bash
$ pnpm add -D forge-sync
```

Or run it directly with `npx` / `pnpx`:

```bash
$ pnpx forge-sync
```

---

## 🚀 Usage

Run the sync command from the root of your monorepo:

```bash
$ pnpm forge-sync
```

### Common Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--dry-run` | Simulate the sync and show generated patches without applying changes. | `false` |
| `--exclude <paths>` | Comma-separated list of paths to ignore during sync. | `[]` |
| `--template-url <url>`| URL of the upstream template repository. | `.../forge-template.git` |
| `--base-ref <ref>` | Base commit/tag to calculate diffs from. Auto-detected from `.forge-meta.json`. | *Auto* |
| `--target-ref <ref>` | Target commit/tag/branch to update to. | `main` |
| `--log-level <level>` | Set logging verbosity (`debug`, `info`, `warn`, `error`). | `info` |
| `-i, --init` | Generate a default configuration file. | - |

### Examples

**Simulate an update:**
```bash
forge-sync --dry-run
```

**Exclude functionality you've heavily customized:**
```bash
forge-sync --exclude "apps/docs,tooling/custom-script.ts"
```

**Update from a specific branch:**
```bash
forge-sync --target-ref "v2-beta"
```

---

## 🔧 Configuration

Create a `forge-sync.config.json` file in your root directory for persistent settings:

```json
{
  "templateUrl": "https://github.com/my-org/my-custom-template.git",
  "excludePaths": [
    "pnpm-lock.yaml",
    "apps/web/public"
  ],
  "postSync": [
    "pnpm install",
    "pnpm format"
  ],
  "logLevel": "info"
}
```

Generate this file automatically:
```bash
forge-sync --init
```

---

## 🧠 How it Works

1.  **Safety Check**: Verifies your working directory is clean.
2.  **Fetch**: Adds the template as a temporary remote and fetches the target reference.
3.  **Diff**: Calculates the difference between your last sync point (stored in `.forge-meta.json`) and the target.
4.  **Patch**: Generates and applies a git patch using a 3-way merge strategy.
5.  **Resolve**:
    *   Standard files use git's automatic conflict markers.
    *   `package.json` files are parsed, and dependencies are merged intelligently (e.g., `^1.0.0` vs `^1.1.0` -> `^1.1.0`).
6.  **Cleanup**: Removes temporary remotes and artifacts.

---

## License

MIT © [Mayank Kumar Chaudhari](https://mayankchaudhari.com)
<hr />

<p align="center">with 💖 by <a href="https://mayankchaudhari.com" target="_blank">Mayank Kumar Chaudhari</a></p>
