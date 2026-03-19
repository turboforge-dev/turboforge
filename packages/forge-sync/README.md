# @turboforge/sync

Keep a real monorepo aligned with its upstream template after the repo has already diverged.

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

`@turboforge/sync` exists because templates are great right up until the moment your repo becomes real. After that, every upstream improvement turns into manual diffing, selective copy-paste, and a quiet fear of breaking local customizations.

This package is the maintenance story inside Turboforge.

Part of the Turboforge system:

- use `@turboforge/sync` to keep the repo shape current
- use [`@turboforge/cli-kit`](/c:/Users/G/web/open-source/turbo-forge/packages/cli-kit/README.md) to build the repo-aware commands around that workflow

## Highlights

- Pull upstream template changes into a repo that has already diverged.
- Preview upgrades before applying them.
- Resolve `package.json` conflicts with package-aware merge rules.

## Why It Exists

Templates stop helping once you have edited them.

From that point on, most teams choose one of two bad options:

- never pull improvements from the source template again
- manually replay changes and hope nothing important was missed

`@turboforge/sync` gives you a third option: treat template updates as an explicit sync workflow.

## Real Example

Your monorepo started from an internal template six months ago.

Since then, the template added:

- a stricter Biome config
- improved release automation
- better docs generation

Your repo also added custom apps, custom package scripts, and local dependency choices.

Instead of copying files by hand, `@turboforge/sync` fetches the upstream template, computes the diff from your last sync point, applies a patch, and resolves `package.json` conflicts with package-aware rules.

## When To Use It

- You maintain a repo that started from a template and still wants to inherit template improvements.
- You want upgrades to be repeatable, reviewable, and less dependent on one maintainer's memory.
- You need a system for "template drift," not just a one-time scaffold.

## When Not To Use It

- Your repo has no upstream template relationship.
- You want to generate a new repo from scratch; use a starter for that.
- You need a full project migration across unrelated architectures.

## Installation

To use it as a CLI tool in your project:

```bash
pnpm add -D @turboforge/sync
```

Or run it directly with `npx`:

```bash
npx @turboforge/sync
```

## Example

Preview what changed upstream before touching the repo:

```bash
npx @turboforge/sync --dry-run
```

Exclude heavily customized paths during sync:

```bash
npx @turboforge/sync --exclude "apps/web,tooling/custom"
```

## Mental Model

`@turboforge/sync` is not a scaffolder.

It is a bridge between:

- the template you started from
- the customized repo you run today

That is the core Turboforge bet: monorepos need an upgrade path, not just a bootstrap command.
