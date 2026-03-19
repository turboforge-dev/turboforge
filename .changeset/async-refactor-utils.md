---
"@turboforge/cli-kit": major
---

**BREAKING CHANGE**: Core utility functions are now asynchronous to improve performance and avoid blocking the event loop.

- `isMonorepo`, `findProjectRoot` (cached), and `resolveConfig` (supports optional strict parsing) now return `Promise`.
- `resolveConfig` now uses non-blocking file system calls throughout.
- `findUp` utility now features a bounded global cache to minimize redundant file system traversals.
- `atomicWrite` now ensures temporary file cleanup on failure, and `safeRename` handles Windows-specific concurrency issues.
- `deepMerge` utility now includes prototype pollution guards.
- `createLogger` now features structured logging (JSON/Text), process-safe stream management, system metadata (PID, Hostname), and automatic cleanup via process exit handlers.
- `getWorkspacePackages` now processes directories in parallel with a concurrency limiter.
- Improved `pnpm-workspace.yaml` parsing to be more robust against comments and varied formatting.
