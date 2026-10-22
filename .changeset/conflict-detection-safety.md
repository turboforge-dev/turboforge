---
"@turboforge/sync": patch
---

Add conflict detection via `findConflictedFiles` to identify unmerged files and safely skip `postSync` commands if critical manifests (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`) have unresolved conflict markers.
Auto-resolve `.changeset/config.json` conflicts preserving the downstream repository slug.
