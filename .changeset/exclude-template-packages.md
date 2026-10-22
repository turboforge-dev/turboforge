---
"@turboforge/sync": minor
---

Add `excludeTemplatePackages` option (defaults to `true`) and CLI flags (`--exclude-template-packages`, `--no-exclude-template-packages`) to prevent template internal packages (`packages/**`) and doc content (`apps/web/content/docs/**`) from leaking into consumer monorepos.
