---
name: git-commit-generator
description: Logic for generating conventional commits or batching multi-scope changes.
---

# Goal
Generate a high-fidelity Conventional Commit message for staged changes. If the changes are too large or span multiple scopes, orchestrate a batching workflow.

# Workflow

## 1. Plan
- Trigger: "commit my changes", "generate a message", "check my work".
- Run `bash ./.agent/skills/git-commit-generator/scripts/collect-git-context.sh > .turboforge/git-context.txt`.
- Analyze `.turboforge/git-context.txt` and related files as needed.

## 2. Validate (The "Fork in the Road")
Analyze the `METADATA` from the script:
- **Condition A (Complexity)**: `FILE_COUNT > 12` OR `LOC_INSERTIONS > 500`.
- **Condition B (Scope Divergence)**: `DETECTED_SCOPES` count > 1.

> Note: `DETECTED_SCOPES` are derived from `.turboforge/packages.json` by the script. Treat them as the single source of truth. Do not infer scopes from directory names.

**Decision Tree:**
1. **If Low Complexity & Single Scope**: Proceed to generate the message directly.
2. **If High Complexity OR Multi-Scope**:
   - Present the `DETECTED_SCOPES`.
   - Ask:
     > "This diff spans [Scopes].  
     > (1) Write one global message  
     > (2) Split into separate commits per scope (recommended)  
     > (3) Focus on one specific scope"

## 3. Execute

### Case: Single/Global Commit
- Determine type using rules below.
- Determine scope:
  - If exactly one scope → use it
  - If multiple scopes → omit or generalize
  - If none → omit

- Format:
  ```
  <type>(<scope>): <description>
  ```

- Rules:
- Imperative mood ("add", not "added")
- Max ~72 chars
- No trailing period
- Be specific (describe change, not files)
- Omit scope for generic root `chore`

### Case: Batching
- For each group in `SCOPE_GROUPS`:
- Generate a message specific to those files
- Provide commands:
  ```bash
  git reset HEAD
  git add [FILES]
  git commit -m "[MESSAGE]"
  ```

## Type Selection Rules
- feat → new capability
- fix → bug fix
- refactor → internal change (no behavior change)
- chore → maintenance, config, deps
- build → build tooling
- ci → pipelines, workflows
- docs → documentation only
- test → tests only
- style → formatting only

## Output Quality Gate
Before returning:
- Does it explain what changed (not just files)?
- Will it make sense in git log later?
- Is the type correct per rules?
- Is the scope meaningful?

If not → refine.

# Examples
- `feat(ui): add primary button variant`
- `fix(web): resolve hydration error on home page`
- `chore(tooling): update turbo pipeline for ci`

# Constraints
- Strictly use Conventional Commit types: `feat`, `fix`, `chore`, `refactor`, `style`, `test`, `docs`, `build`, `ci`.
- Never include `*-lock.json` or `node_modules` in analysis.
