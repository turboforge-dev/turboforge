---
"@turboforge/cli-kit": patch
"@turboforge/sync": patch
---

- `@turboforge/cli-kit`: allow `isCLI(url)` to accept caller `import.meta.url` for accurate entry-point detection when bundled into shared chunks
- `@turboforge/sync`: pass `import.meta.url` to `isCLI()` so the CLI command triggers `main()` instead of exiting silently
- `@turboforge/sync`: fix default `templateUrl` in `DEFAULT_CONFIG` to point to `https://github.com/turboforge-dev/turboforge.git`
- `@turboforge/sync`: replace shell `rm -rf` with cross-platform `node:fs/promises` `rm`
- `@turboforge/sync`: resolve repository initial commit date in JavaScript to avoid non-cross-platform shell pipe to `head -n 1`
