# Turboforge Agent Guidelines

This monorepo uses standardized agent rules and progressive skills defined in [`.agents/rules.md`](./.agents/rules.md).

All AI coding assistants and contributors must align with the conventions outlined in:
- **Monorepo Rules & Guidelines**: [`.agents/rules.md`](./.agents/rules.md)
- **Scaffolding Skill**: [`.agents/skills/template-code-generator/SKILL.md`](./.agents/skills/template-code-generator/SKILL.md)
- **Git Commit Generator**: [`.agents/skills/git-commit-generator/SKILL.md`](./.agents/skills/git-commit-generator/SKILL.md)
- **DRY Refactoring Skill**: [`.agents/skills/dry-refactoring/SKILL.md`](./.agents/skills/dry-refactoring/SKILL.md)

### Agent Working Memory & Context
- **`context.md`**: Maintain a `context.md` (or `.agents/context.md`) for project-specific domain rules, package interactions, and architectural notes.
- **`.brain/`**: Use the `.brain/` directory to store session task lists, intermediate research logs, scratch scripts, and temporary working assets without polluting production source files.

Please review [`.agents/rules.md`](./.agents/rules.md) before scaffolding packages, running rebrand, or authoring commits.
