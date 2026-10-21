---
name: template-code-generator
description: Scaffold monorepo packages, UI components, React hooks, documentation, and example apps using Turboforge Plop generators and Handlebars templates. Use when adding new packages, components, hooks, docs, or example apps.
---

# Template Code Generator

Turboforge uses [Plop.js](https://plopjs.com/) and [Handlebars](https://handlebarsjs.com/) to automate scaffolding across the monorepo. All templates live in `tooling/generators/templates/` and generator logic resides in `tooling/generators/src/`.

---

## 1. Available Generators

| Generator | Command | Target Path | Description |
| :--- | :--- | :--- | :--- |
| **`pkg`** | `pnpm gen pkg` | `packages/<name>` | Scaffold a new package: Pure utilities (`lib`), UI (`ui`), or CLI tool (`cli`) |
| **`docs`** | `pnpm gen docs` | `packages/<pkg>/docs/` | Scaffold documentation directory, `meta.json`, and optional guides |
| **`rc`** | `pnpm gen rc` | `packages/<pkg>/src/...` | Scaffold React component with client/server directive, styles, and test |
| **`hook`** | `pnpm gen hook` | `packages/<pkg>/src/hooks/` | Scaffold custom React hook with test stub |
| **`exp`** | `pnpm gen exp` | `examples/<name>` | Scaffold example application (Vite or Next.js) linked to internal packages |

---

## 2. Invocation & Execution

### Interactive Mode
Run the prompt menu to choose from all available generators:
```bash
pnpm gen
```
*(On Windows PowerShell where script execution policy is restricted, use `pnpm.cmd gen` or run directly with Node: `node --experimental-strip-types ./node_modules/plop/bin/plop.js --plopfile tooling/generators/src/index.ts`)*.

### Direct Generator Invocation
Bypass the top-level menu by specifying the generator name:
```bash
pnpm gen pkg
pnpm gen docs
pnpm gen rc
pnpm gen hook
pnpm gen exp
```

---

## 3. Architecture & Conventions

### A. Package Generator (`pkg`)
- **Package Types**:
  - `lib`: Node.js utilities, algorithmic libraries, and pure logic.
  - `ui`: React UI components configured with Happy-DOM testing.
  - `cli`: Standalone CLI executable built with `@turboforge/cli-kit`.
- **CLI Package Conventions**:
  - **Collision Prevention**: When the package directory or name is `cli`, the core pure-function export is named `shared.ts` (and `shared.test.ts`) instead of `cli.ts` to prevent colliding with the binary entry point `cli.ts`. For other packages, the core file matches the package name.
  - **Multiple Bin Entry Points**: Scaffolds multiple binary aliases in `package.json` (`cli`, `scope`, and `fileName` when distinct), all pointing to `./dist/cli.mjs`.
  - **Config Name (`configName`)**: Config file defaults to `<scope>.config.json` (or package name if not `cli`, never `cli.config.json`) with an interactive prompt for user customization.
- **Configuration Templates**:
  - Test and build configs use ESM extensions: `vitest.config.mts.hbs` and `tsup.config.ts.hbs`.

### B. Documentation Generator (`docs`)
- **Fumadocs `meta.json` Standard**:
  - `meta.json` defines page navigation order in `packages/<pkg>/docs/meta.json`.
  - **`overview` is always first** (derived automatically from package `README.md`).
  - **`api` is always last** (generated automatically by TypeDoc).
  - In-between comment guides developers where to place custom guide pages:
    ```json
    {
      "pages": [
        "overview",
        // Add additional documentation pages here in reading order
        "api"
      ]
    }
    ```
  - **No `"title"` property in `meta.json`**: Package title is injected automatically by `generate-api-docs.ts` as `Version ${version}` to avoid overriding version headers.
  - Scoped Biome override in `biome.json` allows comments in `**/docs/meta.json` without relaxing JSON rules globally.

### C. Component & Hook Generators (`rc`, `hook`)
- Support `"use client"` banner placement via `getBanner(isClient)`.
- Automatically manage barrel exports by updating or creating parent `index.ts` files in nested directories.
- Optional SCSS module (`.module.scss`) and Vitest test stubs (`.test.tsx`).

### D. Example App Generator (`exp`)
- Automatically registers generated example packages under `@example/*` in `.changeset/config.json` `ignore` array to prevent unversioned example apps from triggering releases.

---

## 4. Authoring New Templates & Generators

### Step 1: Create Handlebars Templates
Add template files under `tooling/generators/templates/<generator-name>/`.
Available Plop helpers:
- `{{kebabCase name}}`: `foo-bar`
- `{{camelCase name}}`: `fooBar`
- `{{pascalCase name}}`: `FooBar`
- `{{dashCase name}}`: `foo-bar`
- `{{scopedKebab name}}`: `@scope/package-name`

> [!IMPORTANT]
> When creating config templates for Vite or Vitest, always name them with the `.mts.hbs` extension (e.g. `vitest.config.mts.hbs`) to ensure ESM compatibility.

### Step 2: Implement the Generator Config
Create `tooling/generators/src/<name>.ts`:
```typescript
import path from "node:path";
import type { ActionType, PlopGeneratorConfig } from "plop";
import { cwd, getPackageDirs, TEMPLATE_DIR } from "./utils.ts";

export const myGenerator: PlopGeneratorConfig = {
  description: "Scaffold a custom resource",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "Resource name:",
      validate: (input: string) => input.length > 0 || "Name is required",
    },
  ],
  actions: (data) => {
    if (!data) return [];
    return [
      {
        type: "add",
        path: path.resolve(cwd, "packages/{{kebabCase name}}/index.ts"),
        templateFile: `${TEMPLATE_DIR}my-template/index.ts.hbs`,
        abortOnFail: true,
      },
    ];
  },
};
```

### Step 3: Register in Generator Index
Add the generator to `tooling/generators/src/index.ts`:
```typescript
import { myGenerator } from "./my-generator.ts";

export default async (plop: NodePlopAPI) => {
  // ...
  plop.setGenerator("my-gen", myGenerator);
};
```

---

## 5. Post-Generation Verification Workflow

After generating any package or code artifact:
1. **Sync Dependencies & Metadata**:
   ```bash
   pnpm install
   pnpm sync
   ```
2. **Typecheck & Lint**:
   ```bash
   pnpm typecheck
   pnpm lint
   ```
3. **Run Unit Tests**:
   ```bash
   pnpm test
   ```
