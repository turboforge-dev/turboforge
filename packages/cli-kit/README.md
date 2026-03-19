# @turboforge/cli-kit

> Low-level utilities for building high-performance CLI tools in monorepos.

<p className="flex gap-2">
  <a href="https://github.com/turboforge-dev/turboforge/actions/workflows/ci.yml" rel="noopener noreferrer">
    <img alt="CI" src="https://github.com/turboforge-dev/turboforge/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://codecov.io/gh/turboforge-dev/turboforge/tree/main/packages/@turboforge/cli-kit" rel="noopener noreferrer">
    <img alt="codecov" src="https://codecov.io/gh/turboforge-dev/turboforge/graph/badge.svg?flag=@turboforge/cli-kit" />
  </a> 
  <a href="https://npmjs.com/package/@turboforge/cli-kit" rel="noopener noreferrer">
    <img alt="npm version" src="https://img.shields.io/npm/v/@turboforge/cli-kit" />
  </a>
  <a href="https://npmjs.com/package/@turboforge/cli-kit" rel="noopener noreferrer">
    <img alt="npm downloads" src="https://img.shields.io/npm/d18m/@turboforge/cli-kit" />
  </a>
  <a href="https://npmjs.com/package/@turboforge/cli-kit" rel="noopener noreferrer">
    <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/@turboforge/cli-kit" />
  </a>
  <img alt="license" src="https://img.shields.io/npm/l/@turboforge/cli-kit" />
</p>

## ✨ Features

- **Hierarchical Config Resolution**: Load and merge `.ts`, `.js`, and `.json` configs with type safety.
- **Monorepo Awareness**: Automatic detection of project roots and workspace packages.
- **Structured Logging**: Level-based logging with ANSI colors and optional file output.
- **Workspace Discovery**: Seamlessly find and list packages in pnpm, npm, or yarn monorepos.
- **Robust Utilities**: Zero-dependency helpers for file traversal, deep merging, and JSON/YAML parsing.

## 📦 Installation

```bash
pnpm add @turboforge/cli-kit
```

### Optional Peer Dependencies

To enable TypeScript config loading (`.ts` files) or advanced merging features, install the following:

```bash
pnpm add -D jiti defu
```

- **`jiti`**: Required for loading `.ts` configuration files at runtime.
- **`defu`**: Recommended for robust deep merging of configurations (falls back to a lightweight internal implementation if missing).

## 🚀 Usage

### Config Resolution

Load and merge user configurations with full TypeScript support.

```ts
import { resolveConfig, defineConfig } from "@turboforge/cli-kit";

interface MyToolConfig {
  input: string;
  outDir: string;
}

const config = await resolveConfig<MyToolConfig>({
  name: "my-tool", // Looks for my-tool.config.{ts,js,json}
  defaults: {
    input: "src/index.ts",
    outDir: "dist",
  },
});
```

### Root & Workspace Detection

Reliably detect the monorepo root and discover workspace packages.

```ts
import { findProjectRoot, getWorkspacePackages, isMonorepo } from "@turboforge/cli-kit";

if (isMonorepo()) {
  const root = findProjectRoot();
  const packages = getWorkspacePackages(root);
  
  console.log(`Found ${packages.length} packages in root: ${root}`);
}
```

### Structured Logger

A minimal, high-performance logger with colored terminal output and file persistence.

```ts
import { createLogger } from "@turboforge/cli-kit";

const logger = createLogger({ 
  level: "info", 
  logFile: "./logs/cli.log",
  name: "my-cli"
});

logger.info("Starting build process...");
logger.error("Build failed", new Error("Unexpected token"));
```

## 🧠 API

### `resolveConfig<T>(options)`
Resolves configuration from files, environment variables, and defaults.

### `findProjectRoot(cwd?)`
Finds the root of the project by looking for `.git`, `pnpm-workspace.yaml`, or `package.json`.

### `createLogger(config)`
Creates a structured logger with support for levels, colors, and JSON output.

### `getWorkspacePackages(root)`
Lists all packages in a monorepo workspace with their absolute paths.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/turboforge-dev/turboforge/blob/main/CONTRIBUTING.md) for more details.

## 📄 License

MIT © [Mayank Kumar Chaudhari](https://mayankchaudhari.com)

