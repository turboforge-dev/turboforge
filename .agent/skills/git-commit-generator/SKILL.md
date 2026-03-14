---
name: git-commit-generator
description: Logic for generating conventional commits or batching multi-scope changes.
---

# Goal
Generate a high-fidelity Conventional Commit message for staged changes. If the changes are too large or span multiple scopes, orchestrate a batching workflow.

# Workflow

## 1. Plan
- Trigger: "commit my changes", "generate a message", "check my work".
- Run `./.agent/skills/git-commit-generator/scripts/collect-git-context.sh`.

## 2. Validate (The "Fork in the Road")
Analyze the `METADATA` from the script:
- **Condition A (Complexity)**: `FILE_COUNT > 12` OR `LOC_INSERTIONS > 500`.
- **Condition B (Scope Divergence)**: `DETECTED_SCOPES` count > 1.

**Decision Tree:**
1. **If Low Complexity & Single Scope**: Proceed to generate the message directly.
2. **If High Complexity OR Multi-Scope**:
   - Present the `DETECTED_SCOPES`.
   - Ask: "This diff spans [Scopes]. Should I (1) Write one global message, (2) Batch these into separate commits per scope, or (3) Focus on one specific scope?"

## 3. Execute

### Case: Single/Global Commit
- Format: `<type>(<scope>): <description>`.
- **Constraints**: No Gitmojis. Use `tooling` for configs. Omit scope for generic root `chore`.
- Output: The message in a `text` codeblock.

### Case: Batching
- For each group in `SCOPE_GROUPS`:
  - Generate a message specific to those files.
  - Provide the command: `git reset; git add [FILES]; git commit -m "[MESSAGE]"` for each group.

# Examples
- `feat(ui): add primary button variant`
- `fix(web): resolve hydration error on home page`
- `chore(tooling): update turbo pipeline for ci`

# Constraints
- Strictly use Conventional Commit types: `feat`, `fix`, `chore`, `refactor`, `style`, `test`, `docs`, `build`, `ci`.
- Never include `*-lock.json` or `node_modules` in analysis.
