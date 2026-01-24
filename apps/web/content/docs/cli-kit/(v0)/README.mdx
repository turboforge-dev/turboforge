# TurboForge CLI Kit <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px" />

Essential utilities for building powerful CLIs and tools in Turbo Forge monorepos.

<p className="flex gap-2">
  <a href="https://github.com/react18-tools/turbo-forge/actions/workflows/ci.yml" rel="noopener noreferrer">
    <img alt="CI" src="https://github.com/react18-tools/turbo-forge/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://codecov.io/gh/react18-tools/turbo-forge/tree/main/packages/@turbo-forge/cli-kit" rel="noopener noreferrer">
    <img alt="codecov" src="https://codecov.io/gh/react18-tools/turbo-forge/graph/badge.svg?flag=@turbo-forge/cli-kit" />
  </a> 
  <a href="https://npmjs.com/package/@turbo-forge/cli-kit" rel="noopener noreferrer">
    <img alt="npm version" src="https://img.shields.io/npm/v/@turbo-forge/cli-kit" />
  </a>
  <a href="https://npmjs.com/package/@turbo-forge/cli-kit" rel="noopener noreferrer">
    <img alt="npm downloads" src="https://img.shields.io/npm/d18m/@turbo-forge/cli-kit" />
  </a>
  <a href="https://npmjs.com/package/@turbo-forge/cli-kit" rel="noopener noreferrer">
    <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/@turbo-forge/cli-kit" />
  </a>
  <img alt="license" src="https://img.shields.io/npm/l/@turbo-forge/cli-kit" />
</p>

> **Note:** This package is part of the Turbo Forge ecosystem.

---

## ✨ Features

- **📂 Root Detection**: Robust project root verification using `.git`, `.changeset`, or workspace configs.
- **⚙️ Config Resolution**: Flexible configuration loading with hierarchical merging:
  - Supports `.ts`, `.js`, `.mjs`, and `.json` config files.
  - **Priority**: CLI Args > Environment Variables > Local Config > Parent Config > Defaults.
  - Zero-config TypeScript support via `jiti` (optional).
- **📦 Workspace Discovery**: Utilities to detect and list packages in `pnpm` or `npm` monorepos.
- **🛠️ Zero-Dependency Core**: Lightweight core utilities for file traversal (`findUp`), merging (`deepMerge`), and safe JSON reading.

---

## 📦 Installation

```bash
pnpm add @turbo-forge/cli-kit
```

### Optional Peer Dependencies

To enable TypeScript config loading (`.ts` files) or advanced merging features, install the following:

```bash
pnpm add -D jiti defu
```

- **`jiti`**: Required for loading `.ts` configuration files at runtime.
- **`defu`**: Recommended for robust deep merging of configurations (falls back to a lightweight internal implementation if missing).

---

## 🚀 Usage

### 1. Configuration Resolution

Load and merge user configurations with type safety.

```ts
import { resolveConfig, defineConfig } from "@turbo-forge/cli-kit";

// 1. Define your config type
interface MyToolConfig {
  input: string;
  outDir: string;
  plugins?: string[];
}

// 2. Resolve config at runtime
const config = await resolveConfig<MyToolConfig>({
  name: "my-tool", // Looks for my-tool.config.{ts,js,json}
  defaults: {
    input: "src/index.ts",
    outDir: "dist",
  },
});

console.log(config); 
```

**User Config File (`my-tool.config.ts`):**
```ts
// Users can use the helper for autocomplete
import { defineConfig } from "@turbo-forge/cli-kit";

export default defineConfig({
  input: "src/main.ts", // Overrides default
});
```

### 2. Root & Workspace Detection

Detect the monorepo root and list available workspaces.

```ts
import { findProjectRoot, getWorkspacePackages, isMonorepo } from "@turbo-forge/cli-kit";

// Check if inside a monorepo
if (isMonorepo()) {
  const root = findProjectRoot();
  console.log(`Repo Root: ${root}`);

  // Get all workspace package paths
  const packages = getWorkspacePackages(root);
  console.log("Found packages:", packages);
}
```

### 3. Utilities

Handy helpers for common CLI tasks.

```ts
import { findUp, readJson } from "@turbo-forge/cli-kit";

// Find a file upwards
const gitDir = findUp(process.cwd(), [".git"]);

// Safely read JSON
const pkg = readJson<{ version: string }>("package.json");
```

---

## License

This library is licensed under the MIT open-source license.

<hr />

<p align="center">with 💖 by <a href="https://mayankchaudhari.com" target="_blank">Mayank Kumar Chaudhari</a></p>
