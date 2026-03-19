# @turboforge/cli-kit

Build monorepo-aware CLIs without rewriting config loading, workspace detection, and logging every time.

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

`@turboforge/cli-kit` exists because internal tooling usually starts as one script, then turns into five slightly different scripts with different root-detection rules, different config formats, and no shared mental model. This package gives Turboforge and downstream tools a common foundation.

Part of the Turboforge system:

- use [`@turboforge/sync`](/c:/Users/G/web/open-source/turbo-forge/packages/forge-sync/README.md) when the problem is keeping a repo aligned with its upstream shape
- use `@turboforge/cli-kit` when the problem is building the repo-aware tools that operate inside that shape

## Highlights

- Resolve layered config from defaults, files, env, and CLI input.
- Detect project roots and workspace packages without repo-specific glue code.
- Share one logging and runtime foundation across multiple repo tools.

## Why It Exists

Most CLI helpers are either too generic to understand monorepos or too entangled with one app to reuse cleanly.

`@turboforge/cli-kit` focuses on the boring parts every serious repo tool needs:

- find the real project root
- discover workspace packages
- load layered config from the right place
- log in a way that works for both humans and automation

## Real Example

You are building `repo doctor`, `release check`, and `docs sync` commands for the same workspace.

Without a shared kit, each command re-implements:

- "where is the repo root?"
- "which packages belong to this workspace?"
- "which config wins: default, file, env, or CLI flag?"

With `@turboforge/cli-kit`, those decisions become shared infrastructure instead of repeated code.

## When To Use It

- You are building internal or OSS CLIs that need monorepo awareness.
- You want layered config resolution without writing a config loader from scratch.
- You need a small foundation, not a full CLI framework.

## When Not To Use It

- You only need argument parsing.
- Your tool does not care about workspaces, repo roots, or shared config.
- You want a batteries-included command framework with prompts, subcommands, and plugin loading out of the box.

## 📦 Installation

```bash
pnpm add @turboforge/cli-kit
```

**_or_**

```bash
$ npm install @turboforge/cli-kit
```

**_or_**

```bash
$ yarn add @turboforge/cli-kit
```

### Optional Peer Dependencies

```bash
pnpm add -D jiti defu
```

- `jiti` lets you load TypeScript config files at runtime.
- `defu` gives you richer object merge behavior.

## Example

```ts
import {
  createLogger,
  findProjectRoot,
  getWorkspacePackages,
  resolveConfig,
} from "@turboforge/cli-kit";

const logger = createLogger({ level: "info", name: "repo-doctor" });
const root = await findProjectRoot();
const packages = await getWorkspacePackages(root);

const config = await resolveConfig({
  name: "repo-doctor",
  defaults: { fix: false },
});

logger.info(`checking ${packages.length} packages`, config.fix);
```

## What You Get

- `resolveConfig`: layered config for repo tools
- `findProjectRoot`: stable root detection
- `getWorkspacePackages`: workspace discovery
- `createLogger`: structured output for local use and automation

## Ecosystem Fit

If Turboforge is about keeping a monorepo coherent, `@turboforge/cli-kit` is the layer you build that coherence on top of.
