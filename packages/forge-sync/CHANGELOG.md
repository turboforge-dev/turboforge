# @turboforge/sync

## 0.0.2

### Patch Changes

- [`ec5c689`](https://github.com/turboforge-dev/turboforge/commit/ec5c689b98a9bdc1b6539ae90b41cdbe6bb8daf0) Thanks [@mayank1513](https://github.com/mayank1513)! - - `@turboforge/cli-kit`: allow `isCLI(url)` to accept caller `import.meta.url` for accurate entry-point detection when bundled into shared chunks
  - `@turboforge/sync`: pass `import.meta.url` to `isCLI()` so the CLI command triggers `main()` instead of exiting silently
  - `@turboforge/sync`: fix default `templateUrl` in `DEFAULT_CONFIG` to point to `https://github.com/turboforge-dev/turboforge.git`
  - `@turboforge/sync`: replace shell `rm -rf` with cross-platform `node:fs/promises` `rm`
  - `@turboforge/sync`: resolve repository initial commit date in JavaScript to avoid non-cross-platform shell pipe to `head -n 1`

## 0.0.1

### Patch Changes

- [`a4df7a3`](https://github.com/turboforge-dev/turboforge/commit/a4df7a31cf79dcfa3f929a2d583508d618c12357) Thanks [@mayank1513](https://github.com/mayank1513)! - add `isCLI` utility to `@turboforge/cli-kit` and replace inline entry-point detection in `@turboforge/sync` and the CLI generator template with the shared helper
