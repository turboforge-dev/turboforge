# @turboforge/sync

## 0.1.0

### Minor Changes

- [`cd122be`](https://github.com/turboforge-dev/turboforge/commit/cd122bea3bffd033f5f7993590550787075c6f2e) Thanks [@mayank1513](https://github.com/mayank1513)! - Add `excludeTemplatePackages` option (defaults to `true`) and CLI flags (`--exclude-template-packages`, `--no-exclude-template-packages`) to prevent template internal packages (`packages/**`) and doc content (`apps/web/content/docs/**`) from leaking into consumer monorepos.

### Patch Changes

- [`abbc7df`](https://github.com/turboforge-dev/turboforge/commit/abbc7df1f950aab32c5384224dfb57371a7aa42f) Thanks [@mayank1513](https://github.com/mayank1513)! - Add conflict detection via `findConflictedFiles` to identify unmerged files and safely skip `postSync` commands if critical manifests (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`) have unresolved conflict markers.
  Auto-resolve `.changeset/config.json` conflicts preserving the downstream repository slug.

- [`2f6d4f7`](https://github.com/turboforge-dev/turboforge/commit/2f6d4f79bd1fec55640ba08789229ec6ab2191c7) Thanks [@mayank1513](https://github.com/mayank1513)! - Add `DEFAULT_EXCLUDE_PATHS` to automatically exclude `.commitlintrc.json`, lockfiles, metadata, and identity files when generating and applying template diffs.

- [`b562b94`](https://github.com/turboforge-dev/turboforge/commit/b562b941aa6918886ded11e71f1a40ebc6e30a39) Thanks [@mayank1513](https://github.com/mayank1513)! - Fix pathspec order and target ref in `createAndApplyPatch` to ensure Git exclusions take precedence over repository root match.

## 0.0.2

### Patch Changes

- [`ec5c689`](https://github.com/turboforge-dev/turboforge/commit/ec5c689b98a9bdc1b6539ae90b41cdbe6bb8daf0) Thanks [@mayank1513](https://github.com/mayank1513)! - - `@turboforge/cli-kit`: allow `isCLI(url)` to accept caller `import.meta.url` for accurate entry-point detection when bundled into shared chunks
  - `@turboforge/cli-kit`: add `publishConfig` with public access and provenance
  - `@turboforge/sync`: pass `import.meta.url` to `isCLI()` so CLI command triggers `main()` instead of exiting silently
  - `@turboforge/sync`: add `publishConfig` with public access and provenance
  - `@turboforge/sync`: fix default `templateUrl` to `https://github.com/turboforge-dev/turboforge.git`
  - `@turboforge/sync`: make `postSync` cross-platform by using `pnpm format` and executing commands sequentially
  - `@turboforge/sync`: replace shell `rm -rf` with cross-platform `node:fs/promises` `rm`
  - `@turboforge/sync`: resolve repository initial commit date in JavaScript to avoid non-cross-platform shell pipe to `head -n 1`
  - `@turboforge/remark-typedoc-mdx`: add `publishConfig` with public access and provenance

## 0.0.1

### Patch Changes

- [`a4df7a3`](https://github.com/turboforge-dev/turboforge/commit/a4df7a31cf79dcfa3f929a2d583508d618c12357) Thanks [@mayank1513](https://github.com/mayank1513)! - add `isCLI` utility to `@turboforge/cli-kit` and replace inline entry-point detection in `@turboforge/sync` and the CLI generator template with the shared helper
