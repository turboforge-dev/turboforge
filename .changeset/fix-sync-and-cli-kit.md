---
"@turboforge/cli-kit": patch
"@turboforge/sync": patch
"@turboforge/remark-typedoc-mdx": patch
---

- `@turboforge/cli-kit`: allow `isCLI(url)` to accept caller `import.meta.url` for accurate entry-point detection when bundled into shared chunks
- `@turboforge/cli-kit`: add `publishConfig` with public access and provenance
- `@turboforge/sync`: pass `import.meta.url` to `isCLI()` so CLI command triggers `main()` instead of exiting silently
- `@turboforge/sync`: add `publishConfig` with public access and provenance
- `@turboforge/sync`: fix default `templateUrl` to `https://github.com/turboforge-dev/turboforge.git`
- `@turboforge/sync`: make `postSync` cross-platform by using `pnpm format` and executing commands sequentially
- `@turboforge/sync`: replace shell `rm -rf` with cross-platform `node:fs/promises` `rm`
- `@turboforge/sync`: resolve repository initial commit date in JavaScript to avoid non-cross-platform shell pipe to `head -n 1`
- `@turboforge/remark-typedoc-mdx`: add `publishConfig` with public access and provenance
