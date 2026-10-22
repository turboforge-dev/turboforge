---
"@turboforge/sync": patch
---

Fix pathspec order and target ref in `createAndApplyPatch` to ensure Git exclusions take precedence over repository root match.
