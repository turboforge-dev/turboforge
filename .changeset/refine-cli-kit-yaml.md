---
"@turboforge/cli-kit": patch
---

Refined `cli-kit` with a new YAML parsing utility and improved test coverage.

- Added `yaml` as an optional `peerDependency`.
- Implemented `parseYaml` utility in `src/yaml.ts` with a robust regex fallback for `pnpm-workspace.yaml`.
- Integrated `parseYaml` into `getWorkspacePackages` in `src/workspace.ts`.
- Significantly increased unit test coverage for `logger` and `utils`, specifically targeting error handling and edge cases.
