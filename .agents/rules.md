# Turboforge Rules & Monorepo Guide

Welcome to **Turboforge**. This document defines the engineering standards, monorepo architecture, operational workflows, and agent alignment rules for template users and AI coding assistants.

> [!IMPORTANT]
> **For AI Agents & Developers**: Before scaffolding code, creating packages, generating documentation, or authoring git commits, you MUST consult and activate the corresponding workspace skills under [`.agents/skills/`](./skills/).

---

## 1. Core Philosophy & Approach

Turboforge is designed around a single guiding principle: **day-two operations matter more than day-zero scaffolding**.

- **Opinionated Defaults**: Consistent TypeScript configs, ESM module outputs (`.mts`), linting (Biome), and testing (Vitest) across all packages.
- **Continuous Alignment**: Maintain a clean, maintainable monorepo that stays structured as it grows.
- **Composable Tooling**: Decoupled generators and scripts so projects can expand naturally without lock-in.

---

## 2. Directory Structure

```text
turboforge/
├── apps/
│   └── web/                   # Documentation portal & web site (Next.js, Fumadocs, Tailwind)
├── packages/                  # Workspace packages (libraries, UI components, CLI tools)
├── tooling/
│   ├── generators/            # Plop.js code generators & Handlebars templates
│   │   ├── src/               # Generator configs (pkg, docs, rc, hook, exp)
│   │   └── templates/         # Scaffolding templates (.hbs)
│   └── scripts/               # Operational automation (rebrand, docs, icons, coverage)
├── .agents/
│   ├── rules.md               # Monorepo rules and agent guidance (this file)
│   ├── context.md             # (Optional) Project-specific domain context & notes
│   └── skills/                # Task runbooks and workflows
│       ├── template-code-generator/  # Plop scaffolding procedures
│       ├── git-commit-generator/     # Conventional commit authoring & batching
│       └── dry-refactoring/          # Deduplication & clone elimination
├── .brain/                    # (Optional) Agent memory, task lists, logs, scratchpads
├── .changeset/                # Changeset release configurations
└── .turboforge/               # Template task lists, metadata, and cache
```

---

## 3. Agent Working Context & Memory (.brain / context.md)

To keep the monorepo clean, organized, and aligned over long-running development:

- **`context.md` (Domain Knowledge)**:
  - Agents and users should maintain a `context.md` (or `.agents/context.md`) to document project-specific domain rules, package relationships, architectural decisions, and unique business logic.
- **`.brain/` (Agent Memory & Scratch Space)**:
  - Agents are encouraged to use the `.brain/` directory to store:
    - Session task lists, progress tracking, and checklists
    - Intermediate research notes, schemas, and API exploration
    - Temporary scratch scripts, debug logs, and transient experiment assets
  - Keeping this state inside `.brain/` prevents cluttering production source directories.

---

## 4. Agent Skills & Required Workflows

Always activate and follow the workspace skills:

### A. Code Generation & Scaffolding
- **Skill**: [`template-code-generator`](./skills/template-code-generator/SKILL.md)
- **Rule**: Never manually hand-craft package directories or boilerplate files. Always use `pnpm gen` (`pkg`, `docs`, `rc`, `hook`, `exp`).
- **Conventions**:
  - For CLI packages, pure function exports must reside in `shared.ts` (not `cli.ts`) to avoid collisions with the binary entry point.
  - Test and build configuration templates use `.mts.hbs` (e.g. `vitest.config.mts.hbs`).
  - Package docs `meta.json` must place `"overview"` first, `"api"` last, with NO `"title"` property.

### B. Commit Messages & Batching
- **Skill**: [`git-commit-generator`](./skills/git-commit-generator/SKILL.md)
- **Rule**: Generate Conventional Commits matching the format `<type>(<scope>): <title>`.
- **Guidelines**:
  - Imperative mood, under 72 characters, no trailing period.
  - Never stage or read package lockfiles (`pnpm-lock.yaml`, `package-lock.json`).
  - GPG signing (`commit.gpgsign=true`) must never be disabled or bypassed.

### C. Refactoring & Code Quality
- **Skill**: [`dry-refactoring`](./skills/dry-refactoring/SKILL.md)
- **Rule**: When duplicate code blocks are detected across packages, extract reusable utilities into shared modules.

---

## 5. Key Operational Workflows

### Rebranding the Monorepo (`pnpm rebrand`)
When starting a new project from this template:
```bash
pnpm rebrand
```
- Rebrands repository identity: updates package scopes, `.changeset/config.json` repository slug, `apps/web/src/meta.json`, and layout metadata.
- Clears or replaces template starter packages in `packages/` with your own project code, with safety prompts to prevent accidental data loss.

### Scaffolding New Packages & Docs (`pnpm gen`)
```bash
pnpm gen pkg    # Create a new library, UI package, or CLI tool
pnpm gen docs   # Create docs/meta.json and starter guide for a package
pnpm gen rc     # Scaffold React component with client/server directives
pnpm gen hook   # Scaffold React hook with test stub
pnpm gen exp    # Scaffold example app (Vite or Next.js)
```

### Automated Icon Generation (`pnpm gen:icons`)
Generate all required web app icons and favicons from a single high-resolution square logo (SVG/PNG >= 1024x1024):
```bash
pnpm gen:icons <path-to-logo.png>
```
Outputs:
- `apps/web/src/app/icon.png` (512x512 transparent PNG)
- `apps/web/src/app/apple-icon.jpg` (1024x1024 on `#ffffff`)
- `apps/web/public/favicon.ico` (multi-resolution 16, 32, 48)

### Building Packages & Web Portal
Turboforge optimizes CI and local build speeds by decoupling package builds from the documentation site:
- `pnpm build`: Default build. Builds all workspace packages using Turbo, deliberately excluding `@app/web` for near-instant 2–5s builds.
- `pnpm build:web`: Builds only the Next.js / Fumadocs documentation portal.
- `pnpm build:all`: Compiles all packages and the documentation portal together.

### Documentation Generation (`pnpm docs`)
```bash
pnpm docs
```
- Runs TypeDoc across packages to generate MDX API reference pages.
- Sanitizes unescaped curly braces (`{...}`) in JSDoc to prevent Next.js MDX compilation crashes.
- Deep-merges custom pages and navigation from `packages/<pkg>/docs/meta.json` into Fumadocs without overwriting user navigation hierarchy.

---

## 6. Pre-Commit & PR Verification Checklist

Before committing or pushing changes:
1. `pnpm typecheck` passes with 0 errors across all packages.
2. `pnpm lint` (`biome check .`) passes without warnings or formatting errors.
3. `pnpm test` runs cleanly.
4. Changesets are added via `pnpm changeset` for any publishable package modifications.
5. All commits follow Conventional Commits format with valid scopes.
