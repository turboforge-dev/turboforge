# @turboforge/cli-kit

## 1.0.1

### Patch Changes

- [`a4df7a3`](https://github.com/turboforge-dev/turboforge/commit/a4df7a31cf79dcfa3f929a2d583508d618c12357) Thanks [@mayank1513](https://github.com/mayank1513)! - add `isCLI` utility to `@turboforge/cli-kit` and replace inline entry-point detection in `@turboforge/sync` and the CLI generator template with the shared helper

## 1.0.0

### Major Changes

- [`17c8dd5`](https://github.com/turboforge-dev/turboforge/commit/17c8dd53a3f1afe08a318451f45e158bf91454de) Thanks [@mayank1513](https://github.com/mayank1513)! - **BREAKING CHANGE**: Core utility functions are now asynchronous to improve performance and avoid blocking the event loop.

  - `isMonorepo`, `findProjectRoot` (cached), and `resolveConfig` (supports optional strict parsing) now return `Promise`.
  - `resolveConfig` now uses non-blocking file system calls throughout.
  - `findUp` utility now features a bounded global cache to minimize redundant file system traversals.
  - `atomicWrite` now ensures temporary file cleanup on failure, and `safeRename` handles Windows-specific concurrency issues.
  - `deepMerge` utility now includes prototype pollution guards.
  - `createLogger` now features structured logging (JSON/Text), process-safe stream management, system metadata (PID, Hostname), and automatic cleanup via process exit handlers.
  - `getWorkspacePackages` now processes directories in parallel with a concurrency limiter.
  - Improved `pnpm-workspace.yaml` parsing to be more robust against comments and varied formatting.

### Patch Changes

- [`24334cf`](https://github.com/turboforge-dev/turboforge/commit/24334cf5d8319725bec7f829d16fc870ee7883c4) Thanks [@mayank1513](https://github.com/mayank1513)! - Refined `cli-kit` with a new YAML parsing utility and improved test coverage.

  - Added `yaml` as an optional `peerDependency`.
  - Implemented `parseYaml` utility in `src/yaml.ts` with a robust regex fallback for `pnpm-workspace.yaml`.
  - Integrated `parseYaml` into `getWorkspacePackages` in `src/workspace.ts`.
  - Significantly increased unit test coverage for `logger` and `utils`, specifically targeting error handling and edge cases.
