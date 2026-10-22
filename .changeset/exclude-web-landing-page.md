---
"@turboforge/sync": patch
---

Exclude `apps/web/src/app/(home)/**` and `apps/web/src/meta.json` by default in sync diffs to protect consumer landing page content and branding from being clobbered by template defaults.
